-- Isolated PostgreSQL 17 financial review ledger acceptance.
DO $$
DECLARE
  v jsonb;
  v_first uuid;
BEGIN
  v := public.record_financial_review(
    'evt_partial_refund_0001','charge.refunded',
    'pi_part_refund_test',1200,'PARTIAL_REFUND'
  );
  IF v->>'result' <> 'RECORDED' THEN
    RAISE EXCEPTION 'could not record partial refund';
  END IF;
  v_first := (v->>'review_id')::uuid;
  v := public.record_financial_review(
    'evt_partial_refund_0001','charge.refunded',
    'pi_part_refund_test',1200,'PARTIAL_REFUND'
  );
  IF (v->>'review_id')::uuid IS DISTINCT FROM v_first OR
    (SELECT COUNT(*) FROM public.financial_event_reviews
     WHERE provider_event_id='evt_partial_refund_0001') <> 1 THEN
    RAISE EXCEPTION 'financial event dedupe failed';
  END IF;
  v := public.record_financial_review(
    'evt_dispute_opened_0001','charge.dispute.created',
    NULL,3995,'DISPUTE'
  );
  IF v->>'result' <> 'RECORDED' OR
    (SELECT COUNT(*) FROM public.financial_event_reviews
     WHERE category='DISPUTE' AND status='OPEN') <> 1 THEN
    RAISE EXCEPTION 'dispute not durably recorded';
  END IF;
  v := public.record_financial_review(
    'evt_refund_unknown_001','charge.refunded',
    NULL,NULL,'UNRECOGNIZED_REFUND'
  );
  IF v->>'result' <> 'RECORDED' THEN
    RAISE EXCEPTION 'unrecognized refund not logged';
  END IF;
  IF (SELECT COUNT(*) FROM public.financial_event_reviews) <> 3 THEN
    RAISE EXCEPTION 'ledger count mismatch';
  END IF;
END $$;
DO $$
BEGIN
  BEGIN
    PERFORM public.record_financial_review(
      'invalid-id','charge.refunded',NULL,100,'PARTIAL_REFUND'
    );
    RAISE EXCEPTION 'INVALID_EVENT_ACCEPTED';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'invalid_financial_review' THEN RAISE; END IF;
  END;
  IF has_function_privilege('anon',
    'public.record_financial_review(text,text,text,integer,text)','EXECUTE')
    OR has_function_privilege('authenticated',
    'public.record_financial_review(text,text,text,integer,text)','EXECUTE')
    OR has_table_privilege('anon','public.financial_event_reviews','SELECT')
  THEN RAISE EXCEPTION 'sensitive financial ledger is public'; END IF;
END $$;
SELECT 'financial review ledger idempotence and least privilege passed' AS result;
