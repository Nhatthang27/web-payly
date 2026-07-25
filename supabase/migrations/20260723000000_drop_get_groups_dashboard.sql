-- Drops the per-group dashboard RPC; the "financial summary" feature it
-- backed was removed from the app in favor of the per-group member-balance
-- view, which uses `get_group_member_balances` instead.
DROP FUNCTION IF EXISTS "public"."get_groups_dashboard"("p_from" timestamptz, "p_to" timestamptz);
