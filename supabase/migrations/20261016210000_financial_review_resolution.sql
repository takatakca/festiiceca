-- FESTI-ICE: human resolution of financial event review records.
-- Review-status updates never initiate payments, transfers or refunds.
-- Apply to VERIFIED Supabase project after financial_event_review_ledger.
ALTER TABLE public.financial_event_reviews
  ADD COLUMN IF NOT EXISTS resolution_reason text;
ALTER TABLE public.financial_event_reviews
  ADD CONSTRAINT financial_resolution_reason_minmax
  CHECK (resolution_reason IS NULL OR
         length(resolution_reason) BETWEEN 10 AND 500);

CREATE OR REPLACE FUNCTION public.resolve_financial_review(
  _review_id uuid, _actor uuid, _resolution text, _reason text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_review public.financial_event_reviews%ROWTYPE;
BEGIN
  IF _review_id IS NULL OR _actor IS NULL
    OR _resolution IS NULL OR _resolution NOT IN ('REVIEWED','DISMISSED')
    OR length(trim(coalesce(_reason,''))) NOT BETWEEN 10 AND 500
  THEN RAISE EXCEPTION 'invalid_review_resolution'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id=_actor AND role::text IN ('ADMIN','SUPER_ADMIN')
  ) THEN RAISE EXCEPTION 'financial_review_forbidden'; END IF;

  SELECT * INTO v_review FROM public.financial_event_reviews
  WHERE id=_review_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'financial_review_missing'; END IF;
  IF v_review.status <> 'OPEN' THEN
    RETURN jsonb_build_object('result','ALREADY_RESOLVED',
      'review_id',v_review.id,'status',v_review.status);
  END IF;
  UPDATE public.financial_event_reviews
    SET status=_resolution,
        reviewed_at=now(), reviewed_by=_actor,
        resolution_reason=trim(_reason)
  WHERE id=_review_id AND status='OPEN';
  RETURN jsonb_build_object('result','RESOLVED',
    'review_id',_review_id,'status',_resolution);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.resolve_financial_review(uuid,uuid,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_financial_review(uuid,uuid,text,text)
  TO service_role;
