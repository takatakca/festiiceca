-- Minimal ephemeral PostgreSQL 17 fixtures validating the hardening trigger.
-- Do not run against a production database; CI creates an empty isolated DB.
CREATE TYPE public.order_status AS ENUM ('DRAFT','PENDING_PAYMENT','PAID','CANCELLED');
CREATE TYPE public.public_status AS ENUM ('OPEN','CLOSED','ADVISORY');
CREATE TYPE public.season_status AS ENUM ('DRAFT','ACTIVE');
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY, is_active boolean, status public.season_status,
  is_demo boolean NOT NULL DEFAULT false,
  sales_start_at timestamptz, sales_end_at timestamptz,
  start_date date, end_date date
);
CREATE TABLE public.event_dates (
  id uuid PRIMARY KEY, season_id uuid REFERENCES public.seasons(id),
  event_date date, published boolean, is_test boolean,
  status public.public_status
);
CREATE TABLE public.time_slots (
  id uuid PRIMARY KEY, event_date_id uuid REFERENCES public.event_dates(id),
  start_time time, published boolean, status public.public_status
);
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text,
  time_slot_id uuid REFERENCES public.time_slots(id),
  status public.order_status,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.seasons (id,is_active,status)
VALUES ('00000000-0000-0000-0000-000000000001',true,'ACTIVE');
INSERT INTO public.event_dates (id,season_id,event_date,published,is_test,status)
VALUES ('00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 (now() AT TIME ZONE 'America/Toronto')::date + 7,true,false,'OPEN');
INSERT INTO public.time_slots (id,event_date_id,start_time,published,status)
VALUES ('00000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000002','20:00',true,'OPEN');

