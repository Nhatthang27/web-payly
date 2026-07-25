-- Per-member breakdown for a single group: how much the caller owes each
-- other member, and how much each other member owes the caller. Drives the
-- "select a group, see who you owe / who owes you" dashboard chart.
CREATE OR REPLACE FUNCTION "public"."get_group_member_balances"(
    "p_group_id" uuid,
    "p_from" timestamptz DEFAULT NULL,
    "p_to" timestamptz DEFAULT NULL
) RETURNS TABLE (
    "user_id" uuid,
    "full_name" text,
    "avatar_url" text,
    "i_owe_them" numeric,
    "they_owe_me" numeric
)
    LANGUAGE "sql"
    STABLE
    SET "search_path" = "public"
    AS $$
  with other_members as (
    select gm.user_id, u.full_name, u.avatar_url
    from group_members gm
    join users u on u.id = gm.user_id
    where gm.group_id = p_group_id
      and gm.user_id <> auth.uid()
      -- Caller must themself be a member; RLS on group_members/expenses already
      -- enforces this, kept explicit so the result is empty (not an error) otherwise.
      and exists (
        select 1 from group_members m where m.group_id = p_group_id and m.user_id = auth.uid()
      )
  ),
  i_owe as (
    select e.paid_by as user_id, sum(es.share_amount) as amount
    from expense_splits es
    join expenses e on e.id = es.expense_id
    where e.group_id = p_group_id
      and es.user_id = auth.uid()
      and es.settlement_id is null
      and e.paid_by <> auth.uid()
      and (p_from is null or e.created_at >= p_from)
      and (p_to is null or e.created_at < p_to)
    group by e.paid_by
  ),
  owe_me as (
    select es.user_id, sum(es.share_amount) as amount
    from expense_splits es
    join expenses e on e.id = es.expense_id
    where e.group_id = p_group_id
      and e.paid_by = auth.uid()
      and es.settlement_id is null
      and es.user_id <> auth.uid()
      and (p_from is null or e.created_at >= p_from)
      and (p_to is null or e.created_at < p_to)
    group by es.user_id
  )
  select
    om.user_id,
    om.full_name,
    om.avatar_url,
    coalesce(io.amount, 0) as i_owe_them,
    coalesce(ow.amount, 0) as they_owe_me
  from other_members om
  left join i_owe io on io.user_id = om.user_id
  left join owe_me ow on ow.user_id = om.user_id
$$;

GRANT ALL ON FUNCTION "public"."get_group_member_balances"("p_group_id" uuid, "p_from" timestamptz, "p_to" timestamptz) TO "anon";
GRANT ALL ON FUNCTION "public"."get_group_member_balances"("p_group_id" uuid, "p_from" timestamptz, "p_to" timestamptz) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_group_member_balances"("p_group_id" uuid, "p_from" timestamptz, "p_to" timestamptz) TO "service_role";
