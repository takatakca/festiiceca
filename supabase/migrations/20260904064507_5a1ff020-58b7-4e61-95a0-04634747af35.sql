GRANT SELECT ON public.accommodations, public.business_settings, public.facilities, public.faqs, public.media_assets, public.operational_status, public.page_content, public.programs, public.route_segments, public.seasons, public.venue_contacts, public.venues, public.weather_notices TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accommodations, public.business_settings, public.facilities, public.faqs, public.media_assets, public.operational_status, public.page_content, public.programs, public.route_segments, public.seasons, public.venue_contacts, public.venues, public.weather_notices TO authenticated;

GRANT SELECT ON public.audit_logs, public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

GRANT ALL ON public.accommodations, public.audit_logs, public.business_settings, public.facilities, public.faqs, public.media_assets, public.operational_status, public.page_content, public.programs, public.route_segments, public.seasons, public.user_profiles, public.user_roles, public.venue_contacts, public.venues, public.weather_notices TO service_role;