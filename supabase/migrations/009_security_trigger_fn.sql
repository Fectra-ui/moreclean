-- ============================================================
-- 009 SECURITY: Revoke direct REST access to trigger functions
-- ============================================================
-- check_vehicle_maintenance() is a trigger function — it should
-- only be called by the trigger engine, never via REST API.
-- REVOKE FROM PUBLIC in 008 covers the pseudo-role but not the
-- anon / authenticated roles that Supabase grants by default.
-- ============================================================

revoke execute on function public.check_vehicle_maintenance() from anon;
revoke execute on function public.check_vehicle_maintenance() from authenticated;