-- FESTI-ICE 2026: production checkout RPCs. Apply only to verified project.
-- All three functions are deliberately callable by service_role only.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text UNIQUE;

CREATE OR REPLACE FUNCTION public.create_checkout_order(
 _slot_id uuid, _items jsonb, _flex boolean,
 _customer_email text, _customer_name text, _customer_phone text,
 _family_adults integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $func$
DECLARE
 v_type public.ticket_types%ROWTYPE;
 v_order public.orders%ROWTYPE;
 v_hold public.holds%ROWTYPE;
 v_value jsonb; v_code text; v_qty integer;
 v_seen text[] := ARRAY[]::text[];
 v_lines jsonb := '[]'::jsonb;
 v_season uuid; v_count integer := 0; v_adults integer := 0;
 v_family integer := 0; v_toddler integer := 0;
 v_subtotal integer := 0; v_flex_unit integer := 0; v_flex_total integer := 0;
 v_gst integer; v_qst integer; v_total integer;
BEGIN
 IF _slot_id IS NULL OR jsonb_typeof(_items) <> 'array'
    OR jsonb_array_length(_items) NOT BETWEEN 1 AND 12
    OR length(trim(coalesce(_customer_name,''))) NOT BETWEEN 2 AND 160
    OR length(coalesce(_customer_email,'')) NOT BETWEEN 5 AND 254
    OR _customer_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR length(coalesce(_customer_phone,'')) > 40
    OR coalesce(_family_adults,-1) NOT BETWEEN 0 AND 2
 THEN RAISE EXCEPTION 'invalid_checkout'; END IF;
 SELECT d.season_id INTO v_season
 FROM public.time_slots s
 JOIN public.event_dates d ON d.id = s.event_date_id
 JOIN public.seasons season ON season.id = d.season_id
 WHERE s.id = _slot_id AND s.published AND s.status = 'OPEN'
 AND d.published AND NOT d.is_test AND d.status = 'OPEN'
 AND d.event_date >= (now() AT TIME ZONE 'America/Toronto')::date
 AND season.is_active AND season.status = 'ACTIVE';
 IF NOT FOUND THEN RAISE EXCEPTION 'slot_unavailable'; END IF;
 FOR v_value IN SELECT value FROM jsonb_array_elements(_items) AS x(value) LOOP
   IF jsonb_typeof(v_value) <> 'object' OR jsonb_typeof(v_value->'quantity') <> 'number'
     OR coalesce(v_value->>'quantity','') !~ '^[0-9]{1,2}$'
   THEN RAISE EXCEPTION 'invalid_quantity'; END IF;
   v_code := v_value->>'code'; v_qty := (v_value->>'quantity')::integer;
   IF v_code IS NULL OR v_code = ANY(v_seen) OR v_qty < 1
   THEN RAISE EXCEPTION 'duplicate_or_invalid_code'; END IF;
   v_seen := array_append(v_seen, v_code);
   SELECT * INTO v_type FROM public.ticket_types
    WHERE season_id = v_season AND code = v_code AND active AND NOT is_addon;
   IF NOT FOUND OR v_code = 'OPEN_DATE'
     OR v_qty > v_type.maximum_quantity OR v_qty < v_type.minimum_quantity
     OR (v_type.minimum_group_size IS NOT NULL AND v_qty < v_type.minimum_group_size)
   THEN RAISE EXCEPTION 'ticket_not_available'; END IF;
   v_count := v_count + v_qty; v_subtotal := v_subtotal + v_qty * v_type.price_cents;
   IF v_type.counts_as_adult THEN v_adults := v_adults + v_qty; END IF;
   IF v_code = 'FAMILY' THEN v_family := v_qty; END IF;
   IF v_code = 'TODDLER' THEN v_toddler := v_qty; END IF;
   v_lines := v_lines || jsonb_build_array(jsonb_build_object(
     'code', v_code, 'name', v_type.name_fr, 'quantity', v_qty,
     'unit_amount', v_type.price_cents));
 END LOOP;
 IF v_count NOT BETWEEN 1 AND 60 OR v_toddler = v_count
   OR (v_family > 0 AND (v_family NOT BETWEEN 3 AND 6
      OR _family_adults NOT BETWEEN 1 AND 2 OR _family_adults + v_adults > 2))
   OR (v_family = 0 AND _family_adults <> 0)
 THEN RAISE EXCEPTION 'ineligible_tickets'; END IF;
 IF _flex THEN
   SELECT price_cents INTO v_flex_unit FROM public.ticket_types
   WHERE season_id = v_season AND code = 'FLEX_WEATHER' AND is_addon AND active;
   IF NOT FOUND THEN RAISE EXCEPTION 'flex_unavailable'; END IF;
 END IF;
 v_flex_total := CASE WHEN _flex THEN v_count * v_flex_unit ELSE 0 END;
 v_gst := round((v_subtotal + v_flex_total)::numeric * 0.05)::integer;
 v_qst := round((v_subtotal + v_flex_total)::numeric * 0.09975)::integer;
 v_total := v_subtotal + v_flex_total + v_gst + v_qst;
 IF v_total < 50 THEN RAISE EXCEPTION 'minimum_payment_required'; END IF;
 -- Existing create_hold serializes capacity by slot advisory lock.
 SELECT * INTO v_hold FROM public.create_hold(_slot_id, v_count, 45);
 INSERT INTO public.orders(
  order_number,season_id,time_slot_id,hold_id,customer_email,customer_name,
  customer_phone,quantity,subtotal_cents,flex_cents,gst_cents,qst_cents,
  total_cents,status,snapshot
 ) VALUES(
  'FI-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,14)),
  v_season,_slot_id,v_hold.id,lower(trim(_customer_email)),trim(_customer_name),
  nullif(trim(_customer_phone),''),v_count,v_subtotal,v_flex_total,v_gst,v_qst,
  v_total,'PENDING_PAYMENT',
  jsonb_build_object('flex',_flex,'family_adults',_family_adults)
 ) RETURNING * INTO v_order;
 FOR v_value IN SELECT value FROM jsonb_array_elements(v_lines) AS x(value) LOOP
  INSERT INTO public.order_items(
   order_id,ticket_type_code,name_snapshot,unit_price_cents,quantity,flex_selected
  ) VALUES (
   v_order.id,v_value->>'code',v_value->>'name',
   (v_value->>'unit_amount')::integer,(v_value->>'quantity')::integer,_flex
  );
 END LOOP;
 RETURN jsonb_build_object('order_id',v_order.id,'total_cents',v_total,
   'gst_cents',v_gst,'qst_cents',v_qst,'flex_cents',v_flex_total,
   'ticket_count',v_count,'lines',v_lines);
END;
$func$;

CREATE OR REPLACE FUNCTION public.finalize_checkout_order(
 _order_id uuid,_stripe_session text,_payment_intent text,
 _stripe_event text,_paid_amount integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $func$
DECLARE
 v_order public.orders%ROWTYPE;
 v_hold public.holds%ROWTYPE;
 v_item public.order_items%ROWTYPE;
 v_i integer; v_issued integer := 0;
BEGIN
 IF _order_id IS NULL OR length(coalesce(_stripe_session,'')) < 5
   OR length(coalesce(_stripe_event,'')) < 5
   OR length(coalesce(_payment_intent,'')) < 5
 THEN RAISE EXCEPTION 'invalid_payment_event'; END IF;
 SELECT * INTO v_order FROM public.orders WHERE id = _order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
 IF v_order.status = 'PAID' AND v_order.stripe_checkout_session_id = _stripe_session THEN
  RETURN jsonb_build_object('result','ALREADY_FULFILLED','order_id',v_order.id);
 END IF;
 IF v_order.status <> 'PENDING_PAYMENT'
   OR v_order.stripe_checkout_session_id IS DISTINCT FROM _stripe_session
   OR v_order.total_cents IS DISTINCT FROM _paid_amount
   OR v_order.currency <> 'CAD'
 THEN RAISE EXCEPTION 'payment_mismatch'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_order.time_slot_id::text,0));
 SELECT * INTO v_hold FROM public.holds WHERE id = v_order.hold_id FOR UPDATE;
 IF NOT FOUND OR v_hold.status <> 'ACTIVE' OR v_hold.expires_at < now() THEN
  RAISE EXCEPTION 'expired_hold_manual_refund_required';
 END IF;
 INSERT INTO public.payments(order_id,provider,provider_intent_id,
   provider_event_id,amount_cents,status)
 VALUES(v_order.id,'stripe',_payment_intent,_stripe_event,_paid_amount,'succeeded');
 FOR v_item IN SELECT * FROM public.order_items WHERE order_id = v_order.id LOOP
  FOR v_i IN 1..v_item.quantity LOOP
   INSERT INTO public.tickets(order_id,time_slot_id,ticket_type_code,
       name_snapshot,qr_token,flex_selected)
   VALUES(v_order.id,v_order.time_slot_id,v_item.ticket_type_code,
       v_item.name_snapshot,encode(extensions.gen_random_bytes(32),'hex'),
       v_item.flex_selected);
   v_issued := v_issued + 1;
  END LOOP;
 END LOOP;
 IF v_issued <> v_order.quantity THEN RAISE EXCEPTION 'ticket_count_mismatch'; END IF;
 UPDATE public.holds SET status = 'CONVERTED' WHERE id = v_hold.id;
 UPDATE public.orders SET status = 'PAID',paid_at = now(),
    stripe_payment_intent_id = _payment_intent WHERE id = v_order.id;
 RETURN jsonb_build_object('result','ISSUED','order_id',v_order.id,'tickets',v_issued);
END;
$func$;

CREATE OR REPLACE FUNCTION public.cancel_checkout_order(
 _order_id uuid,_stripe_session text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $func$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
 SELECT * INTO v_order FROM public.orders WHERE id = _order_id FOR UPDATE;
 IF NOT FOUND OR v_order.status <> 'PENDING_PAYMENT'
    OR v_order.stripe_checkout_session_id IS DISTINCT FROM _stripe_session
 THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_order.time_slot_id::text,0));
 UPDATE public.orders SET status = 'CANCELLED' WHERE id = _order_id;
 UPDATE public.holds SET status = 'RELEASED' WHERE id = v_order.hold_id
   AND status = 'ACTIVE';
 RETURN true;
END;
$func$;

REVOKE EXECUTE ON FUNCTION public.create_checkout_order(uuid,jsonb,boolean,text,text,text,integer) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.finalize_checkout_order(uuid,text,text,text,integer) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_checkout_order(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(uuid,jsonb,boolean,text,text,text,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_checkout_order(uuid,text,text,text,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_checkout_order(uuid,text) TO service_role;
