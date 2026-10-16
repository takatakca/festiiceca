-- Disposable PostgreSQL 17 checkout integration schema.
-- Only referenced table structures and the legacy create_hold capacity helper
-- are mirrored from 20260907133044. NO production database is touched.
CREATE TYPE public.season_status AS ENUM ('DRAFT','ACTIVE');
CREATE TYPE public.public_status AS ENUM ('OPEN','CLOSED','ADVISORY');
CREATE TYPE public.order_status AS ENUM ('DRAFT','PENDING_PAYMENT','PAID','CANCELLED','REFUNDED','FAILED');
CREATE TYPE public.hold_status AS ENUM ('ACTIVE','CONVERTED','RELEASED','EXPIRED');
CREATE TYPE public.ticket_status AS ENUM ('VALID','USED','VOID','REFUNDED');
CREATE SCHEMA IF NOT EXISTS extensions;
-- Supabase installs pgcrypto in its extensions schema. Mirror the actual
-- extension placement in this disposable database.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.seasons (
 id uuid PRIMARY KEY, is_active boolean NOT NULL,
 is_demo boolean NOT NULL DEFAULT false,
 status public.season_status NOT NULL,
 sales_start_at timestamptz, sales_end_at timestamptz,
 start_date date, end_date date
);
CREATE TABLE public.event_dates (
 id uuid PRIMARY KEY,
 season_id uuid NOT NULL REFERENCES public.seasons(id),
 event_date date NOT NULL, published boolean NOT NULL,
 is_test boolean NOT NULL, status public.public_status NOT NULL
);
CREATE TABLE public.time_slots (
 id uuid PRIMARY KEY,
 event_date_id uuid NOT NULL REFERENCES public.event_dates(id),
 start_time time NOT NULL, capacity integer NOT NULL,
 published boolean NOT NULL, status public.public_status NOT NULL
);
CREATE TABLE public.ticket_types (
 season_id uuid NOT NULL,
 code text NOT NULL,
 name_fr text NOT NULL,
 price_cents integer NOT NULL,
 minimum_quantity integer NOT NULL DEFAULT 1,
 maximum_quantity integer NOT NULL DEFAULT 20,
 minimum_group_size integer,
 counts_as_adult boolean NOT NULL DEFAULT true,
 is_addon boolean NOT NULL DEFAULT false,
 active boolean NOT NULL DEFAULT true,
 UNIQUE (season_id,code)
);
CREATE TABLE public.holds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 time_slot_id uuid NOT NULL REFERENCES public.time_slots(id),
 quantity integer NOT NULL CHECK(quantity>0),
 status public.hold_status NOT NULL DEFAULT 'ACTIVE',
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_number text NOT NULL UNIQUE,
 season_id uuid REFERENCES public.seasons(id),
 time_slot_id uuid REFERENCES public.time_slots(id),
 hold_id uuid REFERENCES public.holds(id),
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
 status public.order_status NOT NULL DEFAULT 'DRAFT',
 snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
 stripe_payment_intent_id text,
 paid_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES public.orders(id),
 ticket_type_code text NOT NULL,
 name_snapshot text NOT NULL,
 unit_price_cents integer NOT NULL,
 quantity integer NOT NULL,
 flex_selected boolean NOT NULL DEFAULT false
);
CREATE TABLE public.tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES public.orders(id),
 time_slot_id uuid REFERENCES public.time_slots(id),
 ticket_type_code text NOT NULL,
 name_snapshot text NOT NULL,
 qr_token text NOT NULL UNIQUE,
 status public.ticket_status NOT NULL DEFAULT 'VALID',
 flex_selected boolean NOT NULL DEFAULT false
);
CREATE TABLE public.payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES public.orders(id),
 provider text NOT NULL DEFAULT 'stripe',
 provider_intent_id text,
 provider_event_id text UNIQUE,
 amount_cents integer NOT NULL,
 status text NOT NULL
);
-- Copy of existing legacy helper logic from 20260907.
CREATE OR REPLACE FUNCTION public.slot_remaining_capacity(_slot_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT GREATEST(0, s.capacity
 - COALESCE((SELECT sum(h.quantity) FROM public.holds h
    WHERE h.time_slot_id=s.id AND h.status='ACTIVE'
      AND h.expires_at > now()),0)
 - COALESCE((SELECT count(*) FROM public.tickets t
    WHERE t.time_slot_id=s.id AND t.status IN ('VALID','USED')),0))
 FROM public.time_slots s WHERE s.id=_slot_id;
$$;
CREATE OR REPLACE FUNCTION public.create_hold(
 _slot_id uuid, _quantity integer, _minutes integer DEFAULT 10
) RETURNS public.holds LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _remaining integer; _hold public.holds;
BEGIN
 IF _quantity IS NULL OR _quantity <= 0 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_slot_id::text,0));
 UPDATE public.holds SET status='EXPIRED'
 WHERE time_slot_id=_slot_id AND status='ACTIVE' AND expires_at<=now();
 SELECT public.slot_remaining_capacity(_slot_id) INTO _remaining;
 IF _remaining IS NULL THEN RAISE EXCEPTION 'slot_not_found'; END IF;
 IF _remaining < _quantity THEN RAISE EXCEPTION 'insufficient_capacity'; END IF;
 INSERT INTO public.holds(time_slot_id,quantity,expires_at)
 VALUES(_slot_id,_quantity,now()+make_interval(mins=>_minutes))
 RETURNING * INTO _hold;
 RETURN _hold;
END; $$;

INSERT INTO public.seasons(id,is_active,status)
VALUES ('11111111-1111-4111-8111-111111111111',true,'ACTIVE');
INSERT INTO public.event_dates(id,season_id,event_date,published,is_test,status)
VALUES (
 '22222222-2222-4222-8222-222222222222',
 '11111111-1111-4111-8111-111111111111',
 (now() AT TIME ZONE 'America/Toronto')::date+7,true,false,'OPEN'
);
INSERT INTO public.time_slots(id,event_date_id,start_time,capacity,published,status)
VALUES (
 '33333333-3333-4333-8333-333333333333',
 '22222222-2222-4222-8222-222222222222',
 '18:00',10,true,'OPEN'
);
INSERT INTO public.ticket_types(season_id,code,name_fr,price_cents,minimum_quantity,maximum_quantity)
VALUES ('11111111-1111-4111-8111-111111111111','ADULT','Adulte',2300,1,20);
INSERT INTO public.ticket_types(
 season_id,code,name_fr,price_cents,minimum_quantity,maximum_quantity,is_addon
) VALUES (
 '11111111-1111-4111-8111-111111111111','FLEX_WEATHER',
 'Flex météo',500,1,60,true
);
