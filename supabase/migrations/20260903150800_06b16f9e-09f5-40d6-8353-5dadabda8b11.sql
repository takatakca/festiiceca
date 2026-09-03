
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('GATE_STAFF','SUPERVISOR','CONTENT_EDITOR','OPERATIONS','ADMIN','SUPER_ADMIN');
CREATE TYPE public.public_status AS ENUM ('OPEN','ADVISORY','PARTIAL','CLOSED','CANCELLED');
CREATE TYPE public.ice_condition AS ENUM ('EXCELLENT','GOOD','VARIABLE','MAINTENANCE','CLOSED');
CREATE TYPE public.segment_status AS ENUM ('OPEN','ADVISORY','CLOSED');
CREATE TYPE public.season_status AS ENUM ('DRAFT','ACTIVE','ARCHIVED');

-- ============ UPDATED_AT HELPER ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES & ROLES ============
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'fr',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

CREATE OR REPLACE FUNCTION public.is_staff_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['ADMIN','SUPER_ADMIN']::public.app_role[]);
$$;

CREATE POLICY "own profile read" ON public.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff_admin(auth.uid()));
CREATE POLICY "own profile write" ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile insert" ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "roles readable by owner or admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_admin(auth.uid()));

CREATE TRIGGER trg_user_profiles_updated BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEASONS ============
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  sales_start_at TIMESTAMPTZ,
  sales_end_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  currency TEXT NOT NULL DEFAULT 'CAD',
  is_inaugural BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  status public.season_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT season_dates_ordered CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);
GRANT SELECT ON public.seasons TO anon, authenticated;
GRANT ALL ON public.seasons TO service_role;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active seasons" ON public.seasons FOR SELECT TO anon, authenticated
  USING (status = 'ACTIVE');
CREATE POLICY "staff manage seasons" ON public.seasons FOR ALL TO authenticated
  USING (public.is_staff_admin(auth.uid())) WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_seasons_updated BEFORE UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ VENUES ============
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'CA',
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  acreage INTEGER,
  public_description_fr TEXT,
  public_description_en TEXT,
  parking_information TEXT,
  accessibility_information TEXT,
  directions_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.venues TO anon, authenticated;
GRANT ALL ON public.venues TO service_role;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active venues" ON public.venues FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "editors manage venues" ON public.venues FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_venues_updated BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.venue_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'VENUE',
  email TEXT,
  phone TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.venue_contacts TO anon, authenticated;
GRANT ALL ON public.venue_contacts TO service_role;
ALTER TABLE public.venue_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads public contacts" ON public.venue_contacts FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY "editors manage contacts" ON public.venue_contacts FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_venue_contacts_updated BEFORE UPDATE ON public.venue_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ACCOMMODATIONS / FACILITIES ============
CREATE TABLE public.accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  unit_count INTEGER NOT NULL DEFAULT 0 CHECK (unit_count >= 0),
  description_fr TEXT,
  description_en TEXT,
  winter_availability_confirmed BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venue_id, code)
);
GRANT SELECT ON public.accommodations TO anon, authenticated;
GRANT ALL ON public.accommodations TO service_role;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published accommodations" ON public.accommodations FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "editors manage accommodations" ON public.accommodations FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_accommodations_updated BEFORE UPDATE ON public.accommodations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  winter_availability_confirmed BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.facilities TO anon, authenticated;
GRANT ALL ON public.facilities TO service_role;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published facilities" ON public.facilities FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "editors manage facilities" ON public.facilities FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_facilities_updated BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ROUTE SEGMENTS ============
CREATE TABLE public.route_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  street_name TEXT,
  description_fr TEXT,
  description_en TEXT,
  music_style TEXT,
  lighting_style TEXT,
  accent_color TEXT,
  background_color TEXT,
  status public.segment_status NOT NULL DEFAULT 'OPEN',
  public_message_fr TEXT,
  public_message_en TEXT,
  internal_notes TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, slug)
);
GRANT SELECT ON public.route_segments TO anon, authenticated;
GRANT ALL ON public.route_segments TO service_role;
ALTER TABLE public.route_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published segments" ON public.route_segments FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "ops manage segments" ON public.route_segments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','OPERATIONS','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','OPERATIONS','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_route_segments_updated BEFORE UPDATE ON public.route_segments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PROGRAMS ============
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  subtitle_fr TEXT,
  subtitle_en TEXT,
  description_fr TEXT,
  description_en TEXT,
  music_genre TEXT,
  family_friendly BOOLEAN NOT NULL DEFAULT true,
  minimum_age INTEGER CHECK (minimum_age IS NULL OR minimum_age >= 0),
  hero_media_id UUID,
  accent_style TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, slug)
);
GRANT SELECT ON public.programs TO anon, authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published programs" ON public.programs FOR SELECT TO anon, authenticated USING (published AND active);
CREATE POLICY "editors manage programs" ON public.programs FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_programs_updated BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ MEDIA ASSETS ============
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  alt_fr TEXT,
  alt_en TEXT,
  kind TEXT NOT NULL DEFAULT 'IMAGE',
  width INTEGER,
  height INTEGER,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published media" ON public.media_assets FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "editors manage media" ON public.media_assets FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_media_assets_updated BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ FAQ / PAGE CONTENT ============
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  group_fr TEXT NOT NULL,
  group_en TEXT NOT NULL,
  question_fr TEXT NOT NULL,
  question_en TEXT NOT NULL,
  answer_fr TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published faqs" ON public.faqs FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "editors manage faqs" ON public.faqs FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,
  block_key TEXT NOT NULL,
  value_fr TEXT,
  value_en TEXT,
  media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_key, block_key)
);
GRANT SELECT ON public.page_content TO anon, authenticated;
GRANT ALL ON public.page_content TO service_role;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published content" ON public.page_content FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "editors manage content" ON public.page_content FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['CONTENT_EDITOR','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_page_content_updated BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ OPERATIONS ============
CREATE TABLE public.operational_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  event_status public.public_status NOT NULL DEFAULT 'OPEN',
  ice_condition public.ice_condition NOT NULL DEFAULT 'GOOD',
  route_status public.segment_status NOT NULL DEFAULT 'OPEN',
  public_message_fr TEXT,
  public_message_en TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.operational_status TO anon, authenticated;
GRANT ALL ON public.operational_status TO service_role;
ALTER TABLE public.operational_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published status" ON public.operational_status FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "ops manage status" ON public.operational_status FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['OPERATIONS','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['OPERATIONS','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_operational_status_updated BEFORE UPDATE ON public.operational_status FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.weather_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'INFO',
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  body_fr TEXT,
  body_en TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weather_notices TO anon, authenticated;
GRANT ALL ON public.weather_notices TO service_role;
ALTER TABLE public.weather_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published notices" ON public.weather_notices FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "ops manage notices" ON public.weather_notices FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['OPERATIONS','ADMIN','SUPER_ADMIN']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['OPERATIONS','ADMIN','SUPER_ADMIN']::public.app_role[]));
CREATE TRIGGER trg_weather_notices_updated BEFORE UPDATE ON public.weather_notices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ BUSINESS SETTINGS ============
CREATE TABLE public.business_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  value_type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_settings TO anon, authenticated;
GRANT ALL ON public.business_settings TO service_role;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads public settings" ON public.business_settings FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY "admins manage settings" ON public.business_settings FOR ALL TO authenticated
  USING (public.is_staff_admin(auth.uid())) WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_business_settings_updated BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_label TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_staff_admin(auth.uid()));
CREATE INDEX idx_audit_entity ON public.audit_logs (entity_type, entity_id, created_at DESC);
