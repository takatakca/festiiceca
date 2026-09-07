
-- Remove the "Entrée glacée" ambiance
DELETE FROM public.route_segments WHERE slug = 'entree';
UPDATE public.route_segments SET sort_order = sort_order - 1 WHERE sort_order > 1;

CREATE TYPE public.order_status AS ENUM ('DRAFT','PENDING_PAYMENT','PAID','CANCELLED','REFUNDED','FAILED');
CREATE TYPE public.hold_status AS ENUM ('ACTIVE','CONVERTED','RELEASED','EXPIRED');
CREATE TYPE public.ticket_status AS ENUM ('VALID','USED','VOID','REFUNDED');

-- TICKET TYPES
CREATE TABLE public.ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.seasons(id) ON DELETE CASCADE,
  code text NOT NULL,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  description_fr text,
  description_en text,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  minimum_quantity integer NOT NULL DEFAULT 0,
  maximum_quantity integer NOT NULL DEFAULT 10,
  maximum_adults integer,
  minimum_group_size integer,
  counts_as_adult boolean NOT NULL DEFAULT true,
  is_addon boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, code)
);
GRANT SELECT ON public.ticket_types TO anon, authenticated;
GRANT ALL ON public.ticket_types TO service_role;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ticket_types public read" ON public.ticket_types FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "ticket_types staff manage" ON public.ticket_types FOR ALL TO authenticated
  USING (public.is_staff_admin(auth.uid())) WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_ticket_types_updated BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- EVENT DATES
CREATE TABLE public.event_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  status public_status NOT NULL DEFAULT 'OPEN',
  is_test boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, event_date)
);
GRANT SELECT ON public.event_dates TO anon, authenticated;
GRANT ALL ON public.event_dates TO service_role;
ALTER TABLE public.event_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_dates public read" ON public.event_dates FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "event_dates staff manage" ON public.event_dates FOR ALL TO authenticated
  USING (public.is_staff_admin(auth.uid())) WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_event_dates_updated BEFORE UPDATE ON public.event_dates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TIME SLOTS
CREATE TABLE public.time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date_id uuid NOT NULL REFERENCES public.event_dates(id) ON DELETE CASCADE,
  start_time time NOT NULL,
  capacity integer NOT NULL CHECK (capacity >= 0),
  status public_status NOT NULL DEFAULT 'OPEN',
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_date_id, start_time)
);
GRANT SELECT ON public.time_slots TO anon, authenticated;
GRANT ALL ON public.time_slots TO service_role;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "time_slots public read" ON public.time_slots FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "time_slots staff manage" ON public.time_slots FOR ALL TO authenticated
  USING (public.is_staff_admin(auth.uid())) WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_time_slots_updated BEFORE UPDATE ON public.time_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- HOLDS
CREATE TABLE public.holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot_id uuid NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  status hold_status NOT NULL DEFAULT 'ACTIVE',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_holds_slot_active ON public.holds (time_slot_id) WHERE status = 'ACTIVE';
GRANT ALL ON public.holds TO service_role;
ALTER TABLE public.holds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "holds staff read" ON public.holds FOR SELECT TO authenticated
  USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_holds_updated BEFORE UPDATE ON public.holds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  time_slot_id uuid REFERENCES public.time_slots(id) ON DELETE SET NULL,
  hold_id uuid REFERENCES public.holds(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  quantity integer NOT NULL DEFAULT 0,
  subtotal_cents integer NOT NULL DEFAULT 0,
  flex_cents integer NOT NULL DEFAULT 0,
  gst_cents integer NOT NULL DEFAULT 0,
  qst_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD',
  status order_status NOT NULL DEFAULT 'DRAFT',
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders staff read" ON public.orders FOR SELECT TO authenticated
  USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_type_code text NOT NULL,
  name_snapshot text NOT NULL,
  unit_price_cents integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  flex_selected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items staff read" ON public.order_items FOR SELECT TO authenticated
  USING (public.is_staff_admin(auth.uid()));

-- TICKETS
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  time_slot_id uuid REFERENCES public.time_slots(id) ON DELETE SET NULL,
  ticket_type_code text NOT NULL,
  name_snapshot text NOT NULL,
  qr_token text NOT NULL UNIQUE,
  status ticket_status NOT NULL DEFAULT 'VALID',
  flex_selected boolean NOT NULL DEFAULT false,
  scanned_at timestamptz,
  scanned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets staff read" ON public.tickets FOR SELECT TO authenticated
  USING (public.is_staff_admin(auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['GATE_STAFF','SUPERVISOR','OPERATIONS']::public.app_role[]));
GRANT SELECT ON public.tickets TO authenticated;
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  provider_intent_id text,
  provider_event_id text UNIQUE,
  amount_cents integer NOT NULL,
  status text NOT NULL,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments staff read" ON public.payments FOR SELECT TO authenticated
  USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CAPACITY HELPERS
CREATE OR REPLACE FUNCTION public.slot_remaining_capacity(_slot_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT GREATEST(0, s.capacity
    - COALESCE((SELECT SUM(h.quantity) FROM public.holds h
        WHERE h.time_slot_id = s.id AND h.status = 'ACTIVE' AND h.expires_at > now()), 0)
    - COALESCE((SELECT COUNT(*) FROM public.tickets t
        WHERE t.time_slot_id = s.id AND t.status IN ('VALID','USED')), 0))
  FROM public.time_slots s WHERE s.id = _slot_id;
$$;

CREATE OR REPLACE FUNCTION public.create_hold(_slot_id uuid, _quantity integer, _minutes integer DEFAULT 10)
RETURNS public.holds LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _remaining integer; _hold public.holds;
BEGIN
  IF _quantity IS NULL OR _quantity <= 0 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_slot_id::text, 0));
  UPDATE public.holds SET status = 'EXPIRED'
    WHERE time_slot_id = _slot_id AND status = 'ACTIVE' AND expires_at <= now();
  SELECT public.slot_remaining_capacity(_slot_id) INTO _remaining;
  IF _remaining IS NULL THEN RAISE EXCEPTION 'slot_not_found'; END IF;
  IF _remaining < _quantity THEN RAISE EXCEPTION 'insufficient_capacity'; END IF;
  INSERT INTO public.holds (time_slot_id, quantity, expires_at)
    VALUES (_slot_id, _quantity, now() + make_interval(mins => _minutes))
    RETURNING * INTO _hold;
  RETURN _hold;
END; $$;

CREATE OR REPLACE FUNCTION public.redeem_ticket(_qr_token text, _scanner uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t public.tickets;
BEGIN
  SELECT * INTO _t FROM public.tickets WHERE qr_token = _qr_token FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('result','INVALID'); END IF;
  IF _t.status = 'USED' THEN
    RETURN jsonb_build_object('result','ALREADY_USED','scanned_at',_t.scanned_at,'ticket_type',_t.ticket_type_code);
  END IF;
  IF _t.status <> 'VALID' THEN RETURN jsonb_build_object('result','INVALID'); END IF;
  UPDATE public.tickets SET status = 'USED', scanned_at = now(), scanned_by = _scanner
    WHERE id = _t.id;
  RETURN jsonb_build_object('result','VALID','ticket_type',_t.ticket_type_code,'name',_t.name_snapshot);
END; $$;

-- OFFICIAL PRICES
INSERT INTO public.ticket_types (season_id, code, name_fr, name_en, description_fr, description_en, price_cents, minimum_quantity, maximum_quantity, maximum_adults, minimum_group_size, counts_as_adult, is_addon, sort_order)
SELECT s.id, v.code, v.name_fr, v.name_en, v.desc_fr, v.desc_en, v.price, v.min_q, v.max_q, v.max_adults, v.min_group, v.adult, v.addon, v.sort
FROM public.seasons s,
(VALUES
  ('GENERAL','Admission générale — 13 ans et +','General admission — 13 and over','Accès au parcours illuminé pour la séance choisie.','Access to the illuminated route for the selected session.',2995,0,10,NULL::integer,NULL::integer,true,false,1),
  ('SENIOR','Aîné — 65 ans et +','Senior — 65 and over','Une pièce d''identité peut être demandée à l''entrée.','ID may be requested at the gate.',2795,0,10,NULL,NULL,true,false,2),
  ('CHILD','Enfant — 2 à 12 ans','Child — 2 to 12','Doit être accompagné d''un adulte.','Must be accompanied by an adult.',1795,0,10,NULL,NULL,false,false,3),
  ('TODDLER','Bambin — moins de 2 ans','Toddler — under 2','Gratuit. Un billet reste requis pour la capacité.','Free. A ticket is still required for capacity.',0,0,4,NULL,NULL,false,false,4),
  ('FAMILY','Passe familiale','Family pass','Tarif par billet. Minimum 3 billets, maximum 6 billets, maximum 2 adultes.','Per-ticket rate. Minimum 3, maximum 6 tickets, maximum 2 adults.',2195,3,6,2,NULL,false,false,5),
  ('OPEN_DATE','Billet ouvert','Open ticket','Valide à toute date de la saison, selon les disponibilités.','Valid on any season date, subject to availability.',3995,0,10,NULL,NULL,true,false,6),
  ('GROUP','Groupe — 15 personnes et +','Group — 15 or more','Tarif par personne. Minimum de 15 billets requis.','Per-person rate. Minimum 15 tickets.',2696,15,60,NULL,15,true,false,7),
  ('FLEX_WEATHER','Option Flex Météo','Weather Flex option','8 $ par billet. Un seul changement de date ou d''heure, selon les disponibilités.','$8 per ticket. One date or time change, subject to availability.',800,0,60,NULL,NULL,false,true,8)
) AS v(code,name_fr,name_en,desc_fr,desc_en,price,min_q,max_q,max_adults,min_group,adult,addon,sort)
WHERE s.slug = '2026-2027';
