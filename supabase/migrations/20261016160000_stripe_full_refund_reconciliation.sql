-- Signed Stripe full-refund reconciliation. Additive, service-role only.
-- Must be applied to the VERIFIED FESTI-ICE database after checkout migrations.
-- This does not initiate refunds; it only reflects FULL refunds made by the
-- payment operator in Stripe, and voids tickets that must not grant entry.
CREATE OR REPLACE FUNCTION public.record_full_refund(
  _payment_intent text, _stripe_event text, _refunded_amount integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $func$
DECLARE
  v_order public.orders%ROWTYPE;
  v_ticket_count integer;
BEGIN
  IF length(coalesce(_payment_intent,'')) < 5 OR
     length(coalesce(_stripe_event,'')) < 5 OR
     coalesce(_refunded_amount,0) <= 0
  THEN RAISE EXCEPTION 'invalid_refund_event'; END IF;
  SELECT * INTO v_order FROM public.orders
  WHERE stripe_payment_intent_id = _payment_intent FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'refund_order_missing'; END IF;
  IF v_order.currency <> 'CAD' OR v_order.total_cents <> _refunded_amount
  THEN RAISE EXCEPTION 'refund_amount_mismatch'; END IF;
  IF v_order.status = 'REFUNDED' THEN
    RETURN jsonb_build_object('result','ALREADY_REFUNDED','order_id',v_order.id);
  END IF;
  IF v_order.status <> 'PAID' THEN RAISE EXCEPTION 'refund_order_not_paid'; END IF;
  IF v_order.time_slot_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(v_order.time_slot_id::text,0));
  END IF;
  INSERT INTO public.payments(
    order_id, provider, provider_intent_id, provider_event_id,
    amount_cents, status
  ) VALUES (
    v_order.id,'stripe',_payment_intent,_stripe_event,
    -_refunded_amount,'refunded'
  );
  UPDATE public.tickets SET status='REFUNDED'
  WHERE order_id=v_order.id AND status IN ('VALID','USED');
  GET DIAGNOSTICS v_ticket_count = ROW_COUNT;
  UPDATE public.orders SET status='REFUNDED' WHERE id=v_order.id;
  RETURN jsonb_build_object('result','REFUNDED','order_id',v_order.id,
    'revoked_tickets',v_ticket_count);
END;
$func$;
REVOKE EXECUTE ON FUNCTION public.record_full_refund(text,text,integer)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_full_refund(text,text,integer)
  TO service_role;
