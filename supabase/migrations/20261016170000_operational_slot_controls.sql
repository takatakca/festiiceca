-- FESTI-ICE operations audit & authorized slot status changes.
-- Apply only to VERIFIED project after foundational event/ticketing schema.
CREATE TABLE IF NOT EXISTS public.slot_operational_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot_id uuid NOT NULL REFERENCES public.time_slots(id),
  actor_user_id uuid NOT NULL,
  prior_status public.public_status NOT NULL,
  new_status public.public_status NOT NULL,
  reason text NOT NULL CHECK (length(reason) BETWEEN 10 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.slot_operational_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.slot_operational_audit FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.slot_operational_audit TO service_role;
CREATE INDEX IF NOT EXISTS idx_slot_operations_slot_date
 ON public.slot_operational_audit(time_slot_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_slot_operational_status(
  _slot_id uuid, _actor uuid, _status text, _reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $func$
DECLARE
 v_slot public.time_slots%ROWTYPE;
 v_event record;
 v_status public.public_status;
BEGIN
 IF _slot_id IS NULL OR _actor IS NULL OR _status NOT IN ('OPEN','CLOSED')
   OR length(trim(coalesce(_reason,''))) NOT BETWEEN 10 AND 500
 THEN RAISE EXCEPTION 'invalid_operational_update'; END IF;
 IF NOT EXISTS (
   SELECT 1 FROM public.user_roles
   WHERE user_id=_actor AND role IN ('OPERATIONS','ADMIN','SUPER_ADMIN')
 ) THEN RAISE EXCEPTION 'operator_access_denied'; END IF;
 -- Use the same slot advisory lock as create_hold and checkout fulfillment.
 PERFORM pg_advisory_xact_lock(hashtextextended(_slot_id::text, 0));
 SELECT * INTO v_slot FROM public.time_slots WHERE id=_slot_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'slot_not_found'; END IF;
 v_status := _status::public.public_status;
 IF v_slot.status = v_status THEN
   RETURN jsonb_build_object('result','UNCHANGED','slot_id',_slot_id,'status',_status);
 END IF;
 IF v_status = 'OPEN' THEN
   SELECT d.published AS date_published, d.status AS date_status,
    d.is_test AS is_test,
    ((d.event_date + v_slot.start_time) AT TIME ZONE 'America/Toronto') AS starts_at
   INTO v_event FROM public.event_dates d WHERE d.id=v_slot.event_date_id;
   IF NOT FOUND OR NOT v_slot.published OR NOT v_event.date_published
      OR v_event.is_test OR v_event.date_status <> 'OPEN'
      OR v_event.starts_at <= now() + interval '5 minutes'
   THEN RAISE EXCEPTION 'cannot_reopen_unavailable_slot'; END IF;
 END IF;
 UPDATE public.time_slots SET status=v_status WHERE id=_slot_id;
 INSERT INTO public.slot_operational_audit (
   time_slot_id,actor_user_id,prior_status,new_status,reason
 ) VALUES (_slot_id,_actor,v_slot.status,v_status,trim(_reason));
 RETURN jsonb_build_object('result','UPDATED','slot_id',_slot_id,'status',_status);
END;
$func$;
REVOKE EXECUTE ON FUNCTION public.set_slot_operational_status(uuid,uuid,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_slot_operational_status(uuid,uuid,text,text)
  TO service_role;
