-- FESTI-ICE checkout hardening. Additive migration for the VERIFIED project only.
--
-- The original create_checkout_order function creates the hold and order inside
-- one database transaction. A failing BEFORE INSERT trigger rolls back both.
-- Do NOT run against the empty, mismatched "FESTI ICE" Supabase project.
--
-- Reject same-day sessions that already began, unpublished/demo seasons and
-- excessively repeated unpaid holds by the same customer email.

CREATE INDEX IF NOT EXISTS idx_orders_pending_customer_created
  ON public.orders (lower(customer_email), created_at DESC)
  WHERE status = 'PENDING_PAYMENT';

CREATE OR REPLACE FUNCTION public.guard_checkout_order_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_starts timestamptz;
  v_pending integer;
BEGIN
  -- This trigger only gates *new* payment-intent reservations. Historical
  -- orders, staff DRAFT entries, and paid-webhook updates are unaffected.
  IF NEW.status <> 'PENDING_PAYMENT' THEN RETURN NEW; END IF;
  IF NEW.time_slot_id IS NULL OR NEW.customer_email IS NULL
    OR length(trim(NEW.customer_email)) < 5
  THEN RAISE EXCEPTION 'checkout_slot_or_customer_missing'; END IF;

  SELECT ((d.event_date + s.start_time) AT TIME ZONE 'America/Toronto')
  INTO v_starts
  FROM public.time_slots s
  JOIN public.event_dates d ON d.id = s.event_date_id
  JOIN public.seasons season ON season.id = d.season_id
  WHERE s.id = NEW.time_slot_id
    AND s.published AND s.status = 'OPEN'
    AND d.published AND NOT d.is_test AND d.status = 'OPEN'
    AND season.is_active AND season.status = 'ACTIVE'
    AND NOT season.is_demo
    AND (season.sales_start_at IS NULL OR season.sales_start_at <= now())
    AND (season.sales_end_at IS NULL OR season.sales_end_at >= now())
    AND (season.start_date IS NULL OR d.event_date >= season.start_date)
    AND (season.end_date IS NULL OR d.event_date <= season.end_date);
  IF v_starts IS NULL OR v_starts <= now() + interval '5 minutes'
  THEN RAISE EXCEPTION 'checkout_session_unavailable'; END IF;

  -- Serialize pending-order rate checks by normalized email. The slot advisory
  -- lock was already acquired by create_hold, so no parallel checkout can
  -- bypass the max-3 pending orders per customer email per 20 minutes.
  PERFORM pg_advisory_xact_lock(
    hashtextextended('festiice:checkout:' || lower(trim(NEW.customer_email)), 42)
  );
  SELECT count(*) INTO v_pending FROM public.orders
  WHERE lower(customer_email) = lower(trim(NEW.customer_email))
    AND status = 'PENDING_PAYMENT'
    AND created_at >= now() - interval '20 minutes';
  IF v_pending >= 3 THEN RAISE EXCEPTION 'checkout_too_many_pending'; END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_checkout_order_insert ON public.orders;
CREATE TRIGGER trg_guard_checkout_order_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_checkout_order_insert();

-- The trigger is internal; untrusted API roles must not be able to execute the
-- SECURITY DEFINER function directly through Supabase REST RPC.
REVOKE EXECUTE ON FUNCTION public.guard_checkout_order_insert()
  FROM PUBLIC, anon, authenticated;
