-- Utility for assertions. Reject anything but the precise failure reason.
CREATE OR REPLACE PROCEDURE public.expect_checkout_reject(email text, expected text)
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    INSERT INTO public.orders(customer_email,time_slot_id,status)
    VALUES (email,'00000000-0000-0000-0000-000000000003','PENDING_PAYMENT');
    RAISE EXCEPTION 'UNEXPECTED_CHECKOUT_SUCCESS';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> expected THEN RAISE; END IF;
  END;
END;
$$;
INSERT INTO public.orders(customer_email,time_slot_id,status)
VALUES ('visitor@example.ca','00000000-0000-0000-0000-000000000003','PENDING_PAYMENT');
INSERT INTO public.orders(customer_email,time_slot_id,status)
VALUES ('Visitor@example.ca','00000000-0000-0000-0000-000000000003','PENDING_PAYMENT');
INSERT INTO public.orders(customer_email,time_slot_id,status)
VALUES ('VISITOR@example.ca','00000000-0000-0000-0000-000000000003','PENDING_PAYMENT');
CALL public.expect_checkout_reject('visitor@example.ca','checkout_too_many_pending');
-- Different customer is not blocked by a previous customer's quota.
INSERT INTO public.orders(customer_email,time_slot_id,status)
VALUES ('other@example.ca','00000000-0000-0000-0000-000000000003','PENDING_PAYMENT');
-- Cancelled orders should not count toward the rate limit.
UPDATE public.orders SET status='CANCELLED' WHERE customer_email='Visitor@example.ca';
INSERT INTO public.orders(customer_email,time_slot_id,status)
VALUES ('visitor@example.ca','00000000-0000-0000-0000-000000000003','PENDING_PAYMENT');
CALL public.expect_checkout_reject('VISITOR@example.ca','checkout_too_many_pending');

-- Closed and demo-only bookings cannot create new paid orders.
UPDATE public.time_slots SET status='CLOSED';
CALL public.expect_checkout_reject('closed@example.ca','checkout_session_unavailable');
UPDATE public.time_slots SET status='OPEN';
UPDATE public.seasons SET is_demo=true;
CALL public.expect_checkout_reject('demo@example.ca','checkout_session_unavailable');
UPDATE public.seasons SET is_demo=false;
UPDATE public.seasons SET sales_start_at=now()+interval '1 day';
CALL public.expect_checkout_reject('tooearly@example.ca','checkout_session_unavailable');
UPDATE public.seasons SET sales_start_at=NULL;
UPDATE public.seasons SET sales_end_at=now()-interval '1 day';
CALL public.expect_checkout_reject('toolate@example.ca','checkout_session_unavailable');
UPDATE public.seasons SET sales_end_at=NULL;

-- Keep event date and slot jointly in the past relative to Montréal.
UPDATE public.event_dates SET event_date =
 ((now() AT TIME ZONE 'America/Toronto') - interval '1 hour')::date;
UPDATE public.time_slots SET start_time =
 ((now() AT TIME ZONE 'America/Toronto') - interval '1 hour')::time;
CALL public.expect_checkout_reject('past@example.ca','checkout_session_unavailable');

-- Non-checkout drafts are intentionally not restricted.
INSERT INTO public.orders(customer_email,status)
VALUES ('draft@example.ca','DRAFT');
SELECT 'checkout hardening regression passed' AS result;
