-- Full refund records a single negative payment and invalidates both tickets.
SELECT public.record_full_refund('pi_full_refund_1','evt_full_refund_1',3995);
DO $$
BEGIN
 IF (SELECT status FROM public.orders
    WHERE id='00000000-0000-0000-0000-000000000010') <> 'REFUNDED'
 OR (SELECT count(*) FROM public.tickets
    WHERE order_id='00000000-0000-0000-0000-000000000010'
      AND status='REFUNDED') <> 2
 OR (SELECT count(*) FROM public.payments
    WHERE provider_event_id='evt_full_refund_1' AND amount_cents=-3995) <> 1
 THEN RAISE EXCEPTION 'refund reconciliation invariant failed'; END IF;
END $$;
-- Duplicate and alternate repeated signed events do not duplicate refunds.
SELECT public.record_full_refund('pi_full_refund_1','evt_full_refund_1',3995);
SELECT public.record_full_refund('pi_full_refund_1','evt_full_refund_2',3995);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.payments
    WHERE order_id='00000000-0000-0000-0000-000000000010') <> 1
 THEN RAISE EXCEPTION 'duplicate refund payment recorded'; END IF;
END $$;
-- Stripe's refunded amount must match order total.
DO $$
BEGIN
 BEGIN
   PERFORM public.record_full_refund('pi_full_refund_1','evt_partial_1',1000);
   RAISE EXCEPTION 'UNEXPECTED_PARTIAL_REFUND_ACCEPTANCE';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
   IF SQLERRM <> 'refund_amount_mismatch' THEN RAISE; END IF;
 END;
END $$;
SELECT 'refund reconciliation tests passed' AS result;
