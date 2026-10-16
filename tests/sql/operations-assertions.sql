-- DB role defense: no scanner-only actor can change the event.
DO $$
BEGIN
 BEGIN
  PERFORM public.set_slot_operational_status(
   '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000021','CLOSED','Gate operator not authorized');
  RAISE EXCEPTION 'UNEXPECTED_GATE_ACCESS';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM <> 'operator_access_denied' THEN RAISE; END IF;
 END;
END $$;
-- Closing records a single audit trail.
SELECT public.set_slot_operational_status(
 '00000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000020','CLOSED','Weather hazard for visitors');
SELECT public.set_slot_operational_status(
 '00000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000020','CLOSED','Repeated safe closure request');
DO $$
BEGIN
 IF (SELECT count(*) FROM public.slot_operational_audit) <> 1
 OR (SELECT status FROM public.time_slots WHERE id='00000000-0000-0000-0000-000000000003') <> 'CLOSED'
 THEN RAISE EXCEPTION 'slot close auditing failed'; END IF;
END $$;
-- Authorized reopening succeeds for a future published active season.
SELECT public.set_slot_operational_status(
 '00000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000020','OPEN','Conditions officially improved');
DO $$
BEGIN
 IF (SELECT count(*) FROM public.slot_operational_audit) <> 2
 OR (SELECT status FROM public.time_slots WHERE id='00000000-0000-0000-0000-000000000003') <> 'OPEN'
 THEN RAISE EXCEPTION 'slot reopen auditing failed'; END IF;
END $$;
-- Disallow reopening a demo season after closing.
SELECT public.set_slot_operational_status(
 '00000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000020','CLOSED','Close before demo controls');
UPDATE public.seasons SET is_demo=true;
DO $$
BEGIN
 BEGIN
  PERFORM public.set_slot_operational_status(
   '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000020','OPEN','Demo may never reopen');
  RAISE EXCEPTION 'UNEXPECTED_DEMO_REOPEN';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM <> 'cannot_reopen_unavailable_slot' THEN RAISE; END IF;
 END;
END $$;
UPDATE public.seasons SET is_demo=false;
-- Disallow a short or missing operational reason.
DO $$
BEGIN
 BEGIN
  PERFORM public.set_slot_operational_status(
   '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000020','OPEN','short');
  RAISE EXCEPTION 'UNEXPECTED_SHORT_REASON';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM <> 'invalid_operational_update' THEN RAISE; END IF;
 END;
END $$;
SELECT 'operations audit and staff authorization tests passed' AS result;
