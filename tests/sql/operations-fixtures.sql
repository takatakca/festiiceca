-- Disposable PostgreSQL fixture. Never create separate identity authority in production.
CREATE TYPE public.app_role AS ENUM ('GATE_STAFF','OPERATIONS','ADMIN','SUPER_ADMIN');
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id,role)
);
INSERT INTO public.user_roles(user_id,role) VALUES
  ('00000000-0000-0000-0000-000000000020','OPERATIONS'),
  ('00000000-0000-0000-0000-000000000021','GATE_STAFF');
-- Restore a future published event and slot for operations tests.
UPDATE public.event_dates SET event_date =
 ((now() AT TIME ZONE 'America/Toronto')::date+7), published=true, status='OPEN', is_test=false
 WHERE id='00000000-0000-0000-0000-000000000002';
UPDATE public.time_slots SET start_time='20:00',status='OPEN',published=true
 WHERE id='00000000-0000-0000-0000-000000000003';
