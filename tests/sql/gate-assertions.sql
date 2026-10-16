-- Direct SQL entitlement is checked in addition to API role check.
DO $$
BEGIN
  BEGIN
    PERFORM public.redeem_ticket(
      repeat('a',64),'00000000-0000-0000-0000-000000000099');
    RAISE EXCEPTION 'UNEXPECTED_UNAUTHORIZED_GATE_ACCESS';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'scanner_not_authorized' THEN RAISE; END IF;
  END;
END $$;

DO $$
DECLARE
  v jsonb;
  v_scanner uuid := '00000000-0000-0000-0000-000000000021';
BEGIN
  v := public.redeem_ticket(repeat('0',64),v_scanner);
  IF v->>'result' <> 'INVALID' THEN RAISE EXCEPTION 'unknown token accepted'; END IF;
  v := public.redeem_ticket(repeat('9',64),v_scanner);
  IF v->>'result' <> 'INVALID' THEN RAISE EXCEPTION 'unpaid order accepted'; END IF;
  v := public.redeem_ticket(repeat('f',64),v_scanner);
  IF v->>'result' <> 'INVALID' THEN RAISE EXCEPTION 'refunded ticket accepted'; END IF;
  v := public.redeem_ticket(repeat('a',64),v_scanner);
  IF v->>'result' <> 'VALID' OR v ? 'name' THEN
    RAISE EXCEPTION 'valid entry not accepted or PII leaked';
  END IF;
  v := public.redeem_ticket(repeat('a',64),v_scanner);
  IF v->>'result' <> 'ALREADY_USED' THEN
    RAISE EXCEPTION 'second scan accepted';
  END IF;
END $$;
DO $$
BEGIN
 IF (SELECT COUNT(*) FROM public.tickets WHERE qr_token=repeat('a',64)
     AND status='USED' AND scanned_by='00000000-0000-0000-0000-000000000021') <> 1
 THEN RAISE EXCEPTION 'scan audit missing'; END IF;
END $$;
-- Paid but booked on another day.
UPDATE public.event_dates SET event_date =
 (now() AT TIME ZONE 'America/Toronto')::date + 1
 WHERE id='00000000-0000-0000-0000-000000000002';
DO $$
BEGIN
 IF public.redeem_ticket(repeat('b',64),
    '00000000-0000-0000-0000-000000000021')->>'result' <> 'INVALID'
 THEN RAISE EXCEPTION 'future date admission accepted'; END IF;
END $$;
UPDATE public.event_dates SET event_date =
 (now() AT TIME ZONE 'America/Toronto')::date
 WHERE id='00000000-0000-0000-0000-000000000002';
-- Operations closed the session: fail closed.
UPDATE public.time_slots SET status='CLOSED'
 WHERE id='00000000-0000-0000-0000-000000000003';
DO $$
BEGIN
 IF public.redeem_ticket(repeat('c',64),
    '00000000-0000-0000-0000-000000000021')->>'result' <> 'INVALID'
 THEN RAISE EXCEPTION 'closed session admission accepted'; END IF;
END $$;
UPDATE public.time_slots SET status='OPEN'
 WHERE id='00000000-0000-0000-0000-000000000003';
-- Demo period and cancelled season: reject.
UPDATE public.seasons SET is_demo=true;
DO $$
BEGIN
 IF public.redeem_ticket(repeat('d',64),
    '00000000-0000-0000-0000-000000000021')->>'result' <> 'INVALID'
 THEN RAISE EXCEPTION 'demo entry accepted'; END IF;
END $$;
UPDATE public.seasons SET is_demo=false;
UPDATE public.orders SET status='REFUNDED'
 WHERE id='00000000-0000-0000-0000-000000000030';
DO $$
BEGIN
 IF public.redeem_ticket(repeat('e',64),
    '00000000-0000-0000-0000-000000000021')->>'result' <> 'INVALID'
 THEN RAISE EXCEPTION 'newly refunded order accepted'; END IF;
END $$;
-- SECURITY DEFINER not callable by browser roles.
DO $$
BEGIN
 IF has_function_privilege('anon',
     'public.redeem_ticket(text,uuid)','EXECUTE')
    OR has_function_privilege('authenticated',
     'public.redeem_ticket(text,uuid)','EXECUTE')
 THEN RAISE EXCEPTION 'ticket redemption RPC exposed to public roles'; END IF;
END $$;
SELECT 'authorized gate redemption checks passed' AS result;
