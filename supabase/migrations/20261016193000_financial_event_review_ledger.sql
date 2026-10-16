-- Durable financial exceptions from signature-verified Stripe webhooks.
-- Store opaque Stripe references and amount only. No customer PII or raw events.
-- Apply ONLY after authorized Supabase project/schema verification.
CREATE TABLE IF NOT EXISTS public.financial_event_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL CHECK (length(event_type) BETWEEN 5 AND 120),
  payment_intent_id text,
  amount_cents integer CHECK (amount_cents >= 0),
  category text NOT NULL CHECK (
    category IN ('PARTIAL_REFUND','UNRECOGNIZED_REFUND','DISPUTE','OTHER')
  ),
  status text NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','REVIEWED','DISMISSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
ALTER TABLE public.financial_event_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.financial_event_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.financial_event_reviews TO service_role;
CREATE INDEX IF NOT EXISTS idx_financial_reviews_open
  ON public.financial_event_reviews(created_at DESC)
  WHERE status='OPEN';

CREATE OR REPLACE FUNCTION public.record_financial_review(
  _event_id text,_event_type text,_payment_intent text,
  _amount_cents integer,_category text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v_id uuid;
BEGIN
 IF _event_id IS NULL OR _event_id !~ '^evt_[[:alnum:]_]{3,120}$'
    OR _event_type IS NULL OR length(_event_type) NOT BETWEEN 5 AND 120
    OR _category NOT IN ('PARTIAL_REFUND','UNRECOGNIZED_REFUND','DISPUTE','OTHER')
    OR length(coalesce(_payment_intent,'')) > 200
    OR _amount_cents < 0
 THEN RAISE EXCEPTION 'invalid_financial_review'; END IF;
 INSERT INTO public.financial_event_reviews(
  provider_event_id,event_type,payment_intent_id,amount_cents,category
 ) VALUES (
  _event_id,_event_type,nullif(_payment_intent,''),_amount_cents,_category
 ) ON CONFLICT (provider_event_id) DO NOTHING
 RETURNING id INTO v_id;
 IF v_id IS NULL THEN
   SELECT id INTO v_id FROM public.financial_event_reviews
   WHERE provider_event_id=_event_id;
 END IF;
 RETURN jsonb_build_object('result','RECORDED','review_id',v_id);
END;
$f$;
REVOKE EXECUTE ON FUNCTION public.record_financial_review(text,text,text,integer,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_financial_review(text,text,text,integer,text)
  TO service_role;
