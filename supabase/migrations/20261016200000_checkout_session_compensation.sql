-- Compensate when Stripe Checkout session was created and then expired, but
-- persisting its ID to our order failed. The server MUST successfully expire
-- that Stripe session before calling cancel_checkout_order from this path.
-- The function is service_role-only; never expose it to clients.
CREATE OR REPLACE FUNCTION public.cancel_checkout_order(
 _order_id uuid,_stripe_session text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $func$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
 IF _order_id IS NULL THEN RETURN false; END IF;
 SELECT * INTO v_order FROM public.orders WHERE id = _order_id FOR UPDATE;
 IF NOT FOUND OR v_order.status <> 'PENDING_PAYMENT' THEN RETURN false; END IF;
 -- A persisted different Checkout session may still charge: never release.
 -- An absent persisted ID may be released AFTER successful Stripe expiration.
 IF v_order.stripe_checkout_session_id IS NOT NULL AND
    v_order.stripe_checkout_session_id IS DISTINCT FROM _stripe_session
 THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_order.time_slot_id::text,0));
 UPDATE public.orders SET status='CANCELLED' WHERE id=_order_id;
 UPDATE public.holds SET status='RELEASED'
 WHERE id=v_order.hold_id AND status='ACTIVE';
 RETURN true;
END;
$func$;
REVOKE EXECUTE ON FUNCTION public.cancel_checkout_order(uuid,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_checkout_order(uuid,text)
 TO service_role;
