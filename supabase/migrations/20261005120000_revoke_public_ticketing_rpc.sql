-- Security: lock down the ticketing RPCs created in 20260907133044.
--
-- create_hold, redeem_ticket and slot_remaining_capacity are SECURITY DEFINER functions in
-- the exposed public schema. PostgreSQL grants EXECUTE to PUBLIC by default and Supabase
-- also grants it to anon/authenticated, so anyone with the anon key could call them through
-- /rest/v1/rpc/: redeem_ticket marks a ticket USED with a caller-chosen _scanner, and
-- create_hold can reserve a slot's whole capacity.
--
-- Nothing in the site calls these functions today. Only the server (service_role) may.
REVOKE EXECUTE ON FUNCTION public.create_hold(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_ticket(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.slot_remaining_capacity(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_hold(uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_ticket(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.slot_remaining_capacity(uuid) TO service_role;
