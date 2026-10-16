-- FESTI-ICE secured gate redemption.
-- Apply to the VERIFIED event Supabase project AFTER the original ticketing,
-- checkout, operational-controls, and refund migrations. Never to the wrong
-- similarly-named empty Supabase project.
--
-- Explicitly check the caller's product role, paid order and local admission
-- date. Lock order BEFORE ticket, matching the full-refund transaction lock
-- order so an entry cannot race a refund into allowing a revoked ticket.
CREATE OR REPLACE FUNCTION public.redeem_ticket(
  _qr_token text, _scanner uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_ticket_id uuid;
  v_order_id uuid;
  v_ticket public.tickets%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_day record;
BEGIN
  IF _scanner IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.user_roles roles
      WHERE roles.user_id = _scanner
        AND roles.role::text IN (
          'GATE_STAFF','SUPERVISOR','OPERATIONS','ADMIN','SUPER_ADMIN'
        )
    ) THEN
    RAISE EXCEPTION 'scanner_not_authorized';
  END IF;

  -- Verify token shape without logging it. Unknown/forged tokens reveal no
  -- purchaser or order metadata.
  IF _qr_token IS NULL OR _qr_token !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('result','INVALID');
  END IF;

  SELECT ticket.id, ticket.order_id INTO v_ticket_id, v_order_id
  FROM public.tickets ticket WHERE ticket.qr_token = _qr_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('result','INVALID'); END IF;

  -- Full refunds first lock the order row, then update tickets. Keep the
  -- exact same lock order to avoid accepting a concurrent refunded ticket.
  SELECT * INTO v_order
  FROM public.orders orders WHERE orders.id = v_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.status <> 'PAID'
     OR v_order.time_slot_id IS NULL THEN
    RETURN jsonb_build_object('result','INVALID');
  END IF;
  SELECT * INTO v_ticket
  FROM public.tickets ticket WHERE ticket.id = v_ticket_id FOR UPDATE;
  IF NOT FOUND OR v_ticket.order_id <> v_order.id
     OR v_ticket.time_slot_id IS DISTINCT FROM v_order.time_slot_id THEN
    RETURN jsonb_build_object('result','INVALID');
  END IF;
  IF v_ticket.status = 'USED' THEN
    RETURN jsonb_build_object(
      'result','ALREADY_USED',
      'scanned_at',v_ticket.scanned_at,
      'ticket_type',v_ticket.ticket_type_code
    );
  END IF;
  IF v_ticket.status <> 'VALID' THEN
    RETURN jsonb_build_object('result','INVALID');
  END IF;

  SELECT date.event_date,
         date.status AS date_status,
         date.published AS date_published,
         date.is_test AS date_test,
         slot.status AS slot_status,
         slot.published AS slot_published,
         season.is_active AS season_active,
         season.is_demo AS season_demo,
         season.status AS season_status
  INTO v_day
  FROM public.time_slots slot
  JOIN public.event_dates date ON date.id = slot.event_date_id
  JOIN public.seasons season ON season.id = date.season_id
  WHERE slot.id = v_order.time_slot_id;

  -- No invented time window: an admission is valid on its booked Montréal
  -- calendar day, not on unrelated days. Operations can close slots.
  IF NOT FOUND
     OR v_day.event_date <> (now() AT TIME ZONE 'America/Toronto')::date
     OR v_day.date_status <> 'OPEN'
     OR NOT v_day.date_published OR v_day.date_test
     OR v_day.slot_status <> 'OPEN' OR NOT v_day.slot_published
     OR v_day.season_status <> 'ACTIVE'
     OR NOT v_day.season_active OR v_day.season_demo
  THEN
    RETURN jsonb_build_object('result','INVALID');
  END IF;

  UPDATE public.tickets
     SET status = 'USED', scanned_at = now(), scanned_by = _scanner
   WHERE id = v_ticket.id AND status = 'VALID';
  IF NOT FOUND THEN RAISE EXCEPTION 'scanner_conflict'; END IF;

  RETURN jsonb_build_object(
    'result','VALID','ticket_type',v_ticket.ticket_type_code
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.redeem_ticket(text,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_ticket(text,uuid)
  TO service_role;
