-- Aggregates per-group dashboard stats (total spend, the caller's pending
-- debt/receivable, member & expense counts) for every group the caller
-- belongs to, in a single round trip instead of N client-side queries.
-- Scoping to `my_groups` is redundant with RLS on expenses/expense_splits/
-- settlements/group_members, but kept explicit so the query plan doesn't
-- depend on policy definitions staying the same shape.
CREATE OR REPLACE FUNCTION "public"."get_groups_dashboard"(
    "p_from" timestamptz DEFAULT NULL,
    "p_to" timestamptz DEFAULT NULL
) RETURNS TABLE (
    "group_id" uuid,
    "total_expense" numeric,
    "expense_count" integer,
    "pending_i_owe" numeric,
    "pending_owed_to_me" numeric,
    "member_count" integer,
    "last_activity_at" timestamptz
)
    LANGUAGE "sql"
    STABLE
    SET "search_path" = "public"
    AS $$
  with my_groups as (
    select group_id from group_members where user_id = auth.uid()
  ),
  expense_agg as (
    select
      e.group_id,
      sum(e.amount) as total_expense,
      count(*)::int as expense_count,
      max(e.created_at) as last_expense_at
    from expenses e
    where e.group_id in (select group_id from my_groups)
      and (p_from is null or e.created_at >= p_from)
      and (p_to is null or e.created_at < p_to)
    group by e.group_id
  ),
  pending_owe as (
    select e.group_id, sum(es.share_amount) as amount
    from expense_splits es
    join expenses e on e.id = es.expense_id
    where es.user_id = auth.uid()
      and es.settlement_id is null
      and e.paid_by <> auth.uid()
      and e.group_id in (select group_id from my_groups)
      and (p_from is null or e.created_at >= p_from)
      and (p_to is null or e.created_at < p_to)
    group by e.group_id
  ),
  pending_owed as (
    select e.group_id, sum(es.share_amount) as amount
    from expense_splits es
    join expenses e on e.id = es.expense_id
    where e.paid_by = auth.uid()
      and es.settlement_id is null
      and es.user_id <> auth.uid()
      and e.group_id in (select group_id from my_groups)
      and (p_from is null or e.created_at >= p_from)
      and (p_to is null or e.created_at < p_to)
    group by e.group_id
  ),
  member_counts as (
    select group_id, count(*)::int as member_count
    from group_members
    where group_id in (select group_id from my_groups)
    group by group_id
  ),
  last_settlement as (
    select group_id, max(settled_at) as last_settled_at
    from settlements
    where group_id in (select group_id from my_groups)
    group by group_id
  )
  select
    mg.group_id,
    coalesce(ea.total_expense, 0) as total_expense,
    coalesce(ea.expense_count, 0) as expense_count,
    coalesce(po.amount, 0) as pending_i_owe,
    coalesce(pw.amount, 0) as pending_owed_to_me,
    coalesce(mc.member_count, 0) as member_count,
    greatest(ea.last_expense_at, ls.last_settled_at) as last_activity_at
  from my_groups mg
  left join expense_agg ea on ea.group_id = mg.group_id
  left join pending_owe po on po.group_id = mg.group_id
  left join pending_owed pw on pw.group_id = mg.group_id
  left join member_counts mc on mc.group_id = mg.group_id
  left join last_settlement ls on ls.group_id = mg.group_id
$$;

GRANT ALL ON FUNCTION "public"."get_groups_dashboard"("p_from" timestamptz, "p_to" timestamptz) TO "anon";
GRANT ALL ON FUNCTION "public"."get_groups_dashboard"("p_from" timestamptz, "p_to" timestamptz) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_groups_dashboard"("p_from" timestamptz, "p_to" timestamptz) TO "service_role";
