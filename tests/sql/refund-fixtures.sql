-- Extend isolated CI schema with paid orders and QR tickets.
ALTER TYPE public.order_status ADD VALUE 'REFUNDED';
CREATE TYPE public.ticket_status AS ENUM ('VALID','USED','VOID','REFUNDED');
ALTER TABLE public.orders
 ADD COLUMN stripe_payment_intent_id text,
 ADD COLUMN currency text NOT NULL DEFAULT 'CAD',
 ADD COLUMN total_cents integer NOT NULL DEFAULT 0;
CREATE TABLE public.tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid REFERENCES public.orders(id),
 status public.ticket_status
);
CREATE TABLE public.payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid REFERENCES public.orders(id),
 provider text NOT NULL,
 provider_intent_id text,
 provider_event_id text UNIQUE,
 amount_cents integer NOT NULL,
 status text NOT NULL
);
INSERT INTO public.orders(id,customer_email,time_slot_id,status,
  stripe_payment_intent_id,total_cents)
VALUES (
 '00000000-0000-0000-0000-000000000010',
 'paid@example.ca','00000000-0000-0000-0000-000000000003','PAID',
 'pi_full_refund_1',3995
);
INSERT INTO public.tickets(order_id,status)
VALUES ('00000000-0000-0000-0000-000000000010','VALID'),
 ('00000000-0000-0000-0000-000000000010','USED');
