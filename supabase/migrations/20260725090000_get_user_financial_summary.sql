-- Aggregates the current user's financial position across every group they
-- belong to, for the home page hero: total group spend, what they currently
-- owe, and their net balance (owed to them minus what they owe).
-- Always returns exactly one row (zero-filled if the user has no groups).
CREATE OR REPLACE FUNCTION "public"."get_user_financial_summary"()
RETURNS TABLE (
    "total_expense" numeric,
    "total_debt" numeric,
    "total_balance" numeric
)
    LANGUAGE "sql"
    STABLE
    SET "search_path" = "public"
    AS $$
  with my_groups as (
    select group_id from group_members where user_id = auth.uid()
  ),
  expense_total as (
    select coalesce(sum(e.amount), 0) as total_expense
    from expenses e
    where e.group_id in (select group_id from my_groups)
  ),
  debt_total as (
    select coalesce(sum(es.share_amount), 0) as total_debt
    from expense_splits es
    join expenses e on e.id = es.expense_id
    where es.user_id = auth.uid()
      and es.settlement_id is null
      and e.paid_by <> auth.uid()
      and e.group_id in (select group_id from my_groups)
  ),
  owed_total as (
    select coalesce(sum(es.share_amount), 0) as total_owed
    from expense_splits es
    join expenses e on e.id = es.expense_id
    where e.paid_by = auth.uid()
      and es.settlement_id is null
      and es.user_id <> auth.uid()
      and e.group_id in (select group_id from my_groups)
  )
  select
    et.total_expense,
    dt.total_debt,
    (ot.total_owed - dt.total_debt) as total_balance
  from expense_total et, debt_total dt, owed_total ot
$$;

GRANT ALL ON FUNCTION "public"."get_user_financial_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_financial_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_financial_summary"() TO "service_role";
