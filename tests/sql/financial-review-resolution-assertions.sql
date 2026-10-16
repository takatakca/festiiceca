-- Verify manual financial review resolution, no Stripe money movement.
-- The financial_event_reviews ledger and user_roles are built by earlier steps.
INSERT INTO public.user_roles(user_id,role) VALUES
('00000000-0000-0000-0000-000000000022','ADMIN');
DO $$
DECLARE v_id uuid; v_response jsonb;
BEGIN
 SELECT id INTO v_id FROM public.financial_event_reviews
 WHERE provider_event_id='evt_partial_refund_0001';
 BEGIN
   PERFORM public.resolve_financial_review(v_id,
     '00000000-0000-0000-0000-000000000021',
     'REVIEWED','Attempted by gate-only employee');
   RAISE EXCEPTION 'gate role improperly authorized';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
   IF SQLERRM <> 'financial_review_forbidden' THEN RAISE; END IF;
 END;
 BEGIN
   PERFORM public.resolve_financial_review(v_id,
     '00000000-0000-0000-0000-000000000022',
     'REVIEWED','short');
   RAISE EXCEPTION 'short reason improperly authorized';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
   IF SQLERRM <> 'invalid_review_resolution' THEN RAISE; END IF;
 END;
 v_response := public.resolve_financial_review(v_id,
   '00000000-0000-0000-0000-000000000022',
   'REVIEWED','Reviewed transaction manually against Stripe activity');
 IF v_response->>'result' <> 'RESOLVED' THEN
   RAISE EXCEPTION 'valid human review could not be recorded'; END IF;
 IF (SELECT status FROM public.financial_event_reviews WHERE id=v_id) <> 'REVIEWED'
   OR (SELECT reviewed_by FROM public.financial_event_reviews WHERE id=v_id)
      <> '00000000-0000-0000-0000-000000000022'
   OR (SELECT resolution_reason FROM public.financial_event_reviews WHERE id=v_id)
      <> 'Reviewed transaction manually against Stripe activity'
   OR (SELECT reviewed_at FROM public.financial_event_reviews WHERE id=v_id) IS NULL
 THEN RAISE EXCEPTION 'missing reviewed-by/time/reason audit'; END IF;
 v_response := public.resolve_financial_review(v_id,
   '00000000-0000-0000-0000-000000000022',
   'DISMISSED','Do not overwrite the originally recorded decision');
 IF v_response->>'result' <> 'ALREADY_RESOLVED' THEN
   RAISE EXCEPTION 'resolved record overwritten by second request'; END IF;
 IF (SELECT status FROM public.financial_event_reviews WHERE id=v_id) <> 'REVIEWED'
 THEN RAISE EXCEPTION 'immutable review decision was changed'; END IF;
 IF (SELECT COUNT(*) FROM public.payments WHERE provider_event_id='evt_partial_refund_0001') <> 0
 THEN RAISE EXCEPTION 'manual review unexpectedly moved funds'; END IF;
END $$;
DO $$
BEGIN
 IF has_function_privilege('anon',
   'public.resolve_financial_review(uuid,uuid,text,text)','EXECUTE')
 OR has_function_privilege('authenticated',
   'public.resolve_financial_review(uuid,uuid,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'review mutation publicly callable'; END IF;
END $$;
SELECT 'financial review resolution and audit checks passed' AS result;
