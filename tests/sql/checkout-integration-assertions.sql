-- Integration tests of the real create_checkout_order/finalize/cancel RPCs.
-- Run only in the throwaway festiice_checkout_ci PostgreSQL database.
DO $$
DECLARE
  v jsonb;
  v_id uuid;
  v_total integer;
  v_result jsonb;
BEGIN
  v := public.create_checkout_order(
    '33333333-3333-4333-8333-333333333333',
    '[{"code":"ADULT","quantity":2}]'::jsonb,
    true,'Visitor@Example.ca','Test Customer','',0
  );
  v_id := (v->>'order_id')::uuid;
  v_total := (v->>'total_cents')::integer;
  -- 2 x CAD23 + 2 x CAD5 Flex + GST 5% + QST 9.975%.
  IF v_total <> 6439 OR v->>'ticket_count' <> '2'
     OR v->>'flex_cents' <> '1000' OR v->>'gst_cents' <> '280'
     OR v->>'qst_cents' <> '559' THEN
    RAISE EXCEPTION 'server price snapshot mismatch: %',v;
  END IF;
  IF (SELECT customer_email FROM public.orders WHERE id=v_id) <> 'visitor@example.ca'
    OR (SELECT COUNT(*) FROM public.order_items WHERE order_id=v_id) <> 1
    OR (SELECT status FROM public.holds
        WHERE id=(SELECT hold_id FROM public.orders WHERE id=v_id)) <> 'ACTIVE'
  THEN RAISE EXCEPTION 'atomic hold/order/item creation failed'; END IF;
  IF public.slot_remaining_capacity('33333333-3333-4333-8333-333333333333') <> 8
  THEN RAISE EXCEPTION 'hold not subtracted from capacity'; END IF;

  UPDATE public.orders SET stripe_checkout_session_id='cs_test_checkout_one' WHERE id=v_id;
  BEGIN
    PERFORM public.finalize_checkout_order(
      v_id,'cs_wrong_session','pi_test_intent_one','evt_wrong_session',v_total);
    RAISE EXCEPTION 'WRONG_SESSION_ACCEPTED';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'payment_mismatch' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.finalize_checkout_order(
      v_id,'cs_test_checkout_one','pi_test_intent_one','evt_wrong_amount',v_total-1);
    RAISE EXCEPTION 'WRONG_AMOUNT_ACCEPTED';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'payment_mismatch' THEN RAISE; END IF;
  END;
  IF (SELECT COUNT(*) FROM public.tickets WHERE order_id=v_id) <> 0
  THEN RAISE EXCEPTION 'tickets issued before verified amount'; END IF;

  v_result := public.finalize_checkout_order(
    v_id,'cs_test_checkout_one','pi_test_intent_one','evt_paid_one',v_total);
  IF v_result->>'result' <> 'ISSUED' OR v_result->>'tickets' <> '2'
  THEN RAISE EXCEPTION 'paid order was not issued: %',v_result; END IF;
  IF (SELECT status FROM public.orders WHERE id=v_id) <> 'PAID'
    OR (SELECT COUNT(*) FROM public.tickets WHERE order_id=v_id
         AND status='VALID' AND length(qr_token)=64) <> 2
    OR (SELECT status FROM public.holds
        WHERE id=(SELECT hold_id FROM public.orders WHERE id=v_id)) <> 'CONVERTED'
    OR (SELECT COUNT(*) FROM public.payments WHERE order_id=v_id) <> 1
  THEN RAISE EXCEPTION 'paid issuance/ledger/hold conversion mismatch'; END IF;
  IF public.slot_remaining_capacity('33333333-3333-4333-8333-333333333333') <> 8
  THEN RAISE EXCEPTION 'paid ticket counted twice or capacity released incorrectly'; END IF;
  v_result := public.finalize_checkout_order(
    v_id,'cs_test_checkout_one','pi_test_intent_one','evt_paid_retry',v_total);
  IF v_result->>'result' <> 'ALREADY_FULFILLED'
    OR (SELECT COUNT(*) FROM public.tickets WHERE order_id=v_id) <> 2
    OR (SELECT COUNT(*) FROM public.payments WHERE order_id=v_id) <> 1
  THEN RAISE EXCEPTION 'webhook replay issued duplicate tickets'; END IF;

  -- A second reservation can be canceled, releasing its capacity.
  v := public.create_checkout_order(
    '33333333-3333-4333-8333-333333333333',
    '[{"code":"ADULT","quantity":2}]'::jsonb,
    false,'second@example.ca','Second Visitor','',0
  );
  v_id := (v->>'order_id')::uuid;
  v_total := (v->>'total_cents')::integer;
  IF v_total <> 5289 THEN RAISE EXCEPTION 'price without flex incorrect'; END IF;
  UPDATE public.orders SET stripe_checkout_session_id='cs_test_checkout_two' WHERE id=v_id;
  IF NOT public.cancel_checkout_order(v_id,'cs_test_checkout_two')
     OR public.cancel_checkout_order(v_id,'cs_test_checkout_two')
  THEN RAISE EXCEPTION 'cancel not idempotent'; END IF;
  IF (SELECT status FROM public.orders WHERE id=v_id) <> 'CANCELLED'
    OR public.slot_remaining_capacity('33333333-3333-4333-8333-333333333333') <> 8
  THEN RAISE EXCEPTION 'cancel did not restore available capacity'; END IF;

  -- Nine admission tickets exceed 8 remaining, reject without a new order.
  BEGIN
    PERFORM public.create_checkout_order(
      '33333333-3333-4333-8333-333333333333',
      '[{"code":"ADULT","quantity":9}]'::jsonb,
      false,'large@example.ca','Large Party','',0
    );
    RAISE EXCEPTION 'OVERSELL_ACCEPTED';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'insufficient_capacity' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.create_checkout_order(
      '33333333-3333-4333-8333-333333333333',
      '[{"code":"ADULT","quantity":1},{"code":"ADULT","quantity":1}]'::jsonb,
      false,'duplicate@example.ca','Duplicate Code','',0
    );
    RAISE EXCEPTION 'DUPLICATE_TICKET_TYPES_ACCEPTED';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'duplicate_or_invalid_code' THEN RAISE; END IF;
  END;
  IF (SELECT COUNT(*) FROM public.orders) <> 2
  THEN RAISE EXCEPTION 'failed transactions leaked orders'; END IF;
END $$;

-- If Stripe successfully expired a newly-created Checkout session but its
-- ID could not be persisted, release only the pending unlinked hold.
DO $$
DECLARE v jsonb; v_id uuid; v_hold uuid; v_canceled boolean;
BEGIN
 v := public.create_checkout_order(
   '33333333-3333-4333-8333-333333333333',
   '[{"code":"ADULT","quantity":1}]'::jsonb,
   false,'orphan@example.ca','Orphan Checkout','',0);
 v_id := (v->>'order_id')::uuid;
 SELECT hold_id INTO v_hold FROM public.orders WHERE id=v_id;
 -- The cancellation and the resulting hold state require separate SQL
 -- statements: PostgreSQL evaluation order within one expression is undefined.
 v_canceled := public.cancel_checkout_order(v_id,'cs_verified_expired_orphan');
 IF NOT v_canceled THEN RAISE EXCEPTION 'orphan cancellation returned false'; END IF;
 IF (SELECT status FROM public.holds WHERE id=v_hold) <> 'RELEASED'
 THEN RAISE EXCEPTION 'orphan Stripe session hold was not released'; END IF;
 IF public.slot_remaining_capacity('33333333-3333-4333-8333-333333333333') <> 8
 THEN RAISE EXCEPTION 'orphan compensation leaked reserved capacity'; END IF;

 -- But a persisted session ID cannot be canceled by a different ID.
 v := public.create_checkout_order(
   '33333333-3333-4333-8333-333333333333',
   '[{"code":"ADULT","quantity":1}]'::jsonb,
   false,'protected@example.ca','Protected Session','',0);
 v_id := (v->>'order_id')::uuid;
 UPDATE public.orders SET stripe_checkout_session_id='cs_actual_active'
 WHERE id=v_id;
 IF public.cancel_checkout_order(v_id,'cs_unrelated') THEN
   RAISE EXCEPTION 'different live Checkout session was canceled'; END IF;
 IF (SELECT status FROM public.orders WHERE id=v_id) <> 'PENDING_PAYMENT'
 THEN RAISE EXCEPTION 'incorrect session cancellation mutated order'; END IF;
 IF NOT public.cancel_checkout_order(v_id,'cs_actual_active') THEN
   RAISE EXCEPTION 'matching Checkout session not cancellable'; END IF;
END $$;

DO $$
BEGIN
 IF has_function_privilege('anon',
  'public.create_checkout_order(uuid,jsonb,boolean,text,text,text,integer)','EXECUTE')
  OR has_function_privilege('authenticated',
  'public.finalize_checkout_order(uuid,text,text,text,integer)','EXECUTE')
  OR has_function_privilege('anon',
  'public.cancel_checkout_order(uuid,text)','EXECUTE')
 THEN RAISE EXCEPTION 'paid booking RPC granted to untrusted roles'; END IF;
END $$;
SELECT 'foundation checkout + payment + cancel + capacity integration passed' AS result;
