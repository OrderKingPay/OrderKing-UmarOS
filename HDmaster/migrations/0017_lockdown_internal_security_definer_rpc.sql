-- Internal OrderKing SECURITY DEFINER functions must not be callable through
-- the exposed Data API by anonymous or normal authenticated clients.
revoke execute on function public.orderking_capture_audit_log() from public, anon, authenticated;
revoke execute on function public.orderking_capture_growth_event() from public, anon, authenticated;
revoke execute on function public.orderking_capture_ledger_entry() from public, anon, authenticated;
revoke execute on function public.orderking_capture_order_change() from public, anon, authenticated;
revoke execute on function public.orderking_capture_order_event() from public, anon, authenticated;
revoke execute on function public.orderking_capture_payment() from public, anon, authenticated;
revoke execute on function public.orderking_capture_payment_webhook() from public, anon, authenticated;
revoke execute on function public.orderking_capture_rider_location() from public, anon, authenticated;
revoke execute on function public.orderking_emit_immutable_event(
  text, text, text, text, text, text, text, timestamptz, jsonb
) from public, anon, authenticated;
revoke execute on function public.orderking_immutable_event_guard() from public, anon, authenticated;
revoke execute on function public.orderking_immutable_hash_chain() from public, anon, authenticated;
revoke execute on function public.orderking_qualify_referral_on_order() from public, anon, authenticated;
revoke execute on function public.prepare_security_event_ledger() from public, anon, authenticated;
revoke execute on function public.prevent_security_event_mutation() from public, anon, authenticated;

-- Keep internal helper functions on a deterministic search path to avoid
-- search_path shadowing risks in SECURITY DEFINER contexts.
alter function public.orderking_immutable_block_mutation()
  set search_path = pg_catalog, public;
alter function public.sync_orderking_menu_item_aliases()
  set search_path = pg_catalog, public;
