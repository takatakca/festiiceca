-- Apply to an ephemeral PostgreSQL 17 database after refund/operations
-- fixtures. No live customer identities are created.
ALTER TABLE public.tickets
  ADD COLUMN qr_token text,
  ADD COLUMN time_slot_id uuid,
  ADD COLUMN ticket_type_code text NOT NULL DEFAULT 'ADULT',
  ADD COLUMN scanned_at timestamptz,
  ADD COLUMN scanned_by uuid;
CREATE UNIQUE INDEX gate_test_qr_unique ON public.tickets(qr_token);

-- Existing order was fully refunded by preceding tests. Set a QR on one
-- revoked ticket; it must never grant entry.
UPDATE public.tickets SET
 qr_token = repeat('f',64),
 time_slot_id = '00000000-0000-0000-0000-000000000003'
WHERE id = (SELECT min(id) FROM public.tickets
            WHERE order_id='00000000-0000-0000-0000-000000000010');

-- One paid/issued order for the current Montréal day.
UPDATE public.event_dates SET event_date =
  (now() AT TIME ZONE 'America/Toronto')::date, published=true,
  is_test=false, status='OPEN'
WHERE id='00000000-0000-0000-0000-000000000002';
UPDATE public.time_slots SET status='OPEN',published=true
WHERE id='00000000-0000-0000-0000-000000000003';

INSERT INTO public.orders(
  id,customer_email,time_slot_id,status,
  stripe_payment_intent_id,total_cents
) VALUES (
  '00000000-0000-0000-0000-000000000030',
  'admission@example.ca',
  '00000000-0000-0000-0000-000000000003',
  'PAID','pi_gate_paid',5000
);
INSERT INTO public.tickets(
  order_id,time_slot_id,status,qr_token,ticket_type_code
) VALUES
 ('00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000003',
  'VALID',repeat('a',64),'ADULT'),
 ('00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000003',
  'VALID',repeat('b',64),'ADULT'),
 ('00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000003',
  'VALID',repeat('c',64),'ADULT'),
 ('00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000003',
  'VALID',repeat('d',64),'ADULT'),
 ('00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000003',
  'VALID',repeat('e',64),'ADULT');

INSERT INTO public.orders(
  id,customer_email,time_slot_id,status,total_cents
) VALUES (
  '00000000-0000-0000-0000-000000000031',
  'pending@example.ca',
  '00000000-0000-0000-0000-000000000003',
  'PENDING_PAYMENT',5000
);
INSERT INTO public.tickets(
  order_id,time_slot_id,status,qr_token,ticket_type_code
) VALUES (
 '00000000-0000-0000-0000-000000000031',
 '00000000-0000-0000-0000-000000000003',
 'VALID',repeat('9',64),'ADULT');
