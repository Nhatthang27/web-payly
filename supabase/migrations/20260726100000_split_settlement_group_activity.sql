-- Splits the single "latest settlement" column pair into "paid" (the user
-- settled a debt to someone else) and "received" (someone else settled a
-- debt to the user), so the GroupCard activity line can distinguish outgoing
-- from incoming settlements instead of showing one ambiguous entry.
DROP FUNCTION IF EXISTS "public"."get_group_activities"("p_user_id" uuid);

CREATE FUNCTION "public"."get_group_activities"(
    "p_user_id" uuid
) RETURNS TABLE (
    "group_id" uuid,
    "latest_expense_id" uuid,
    "latest_expense_title" text,
    "latest_expense_amount" numeric,
    "latest_expense_at" timestamptz,
    "latest_debt_expense_id" uuid,
    "latest_debt_title" text,
    "latest_debt_amount" numeric,
    "latest_debt_at" timestamptz,
    "latest_settlement_paid_id" uuid,
    "latest_settlement_paid_title" text,
    "latest_settlement_paid_amount" numeric,
    "latest_settlement_paid_at" timestamptz,
    "latest_settlement_received_id" uuid,
    "latest_settlement_received_title" text,
    "latest_settlement_received_amount" numeric,
    "latest_settlement_received_at" timestamptz
)
    LANGUAGE "sql"
    STABLE
    SET "search_path" = "public"
    AS $$
  with my_groups as (
    select group_id from group_members where user_id = p_user_id
  )
  select
    mg.group_id,
    le.id, le.title, le.amount, le.created_at,
    ld.expense_id, ld.title, ld.share_amount, ld.created_at,
    lsp.id, lsp.title, lsp.amount, lsp.settled_at,
    lsr.id, lsr.title, lsr.amount, lsr.settled_at
  from my_groups mg
  left join lateral (
    select e.id, e.title, e.amount, e.created_at
    from expenses e
    where e.group_id = mg.group_id
      and e.paid_by = p_user_id
    order by e.created_at desc
    limit 1
  ) le on true
  left join lateral (
    select e.id as expense_id, e.title, es.share_amount, e.created_at
    from expense_splits es
    join expenses e on e.id = es.expense_id
    where e.group_id = mg.group_id
      and es.user_id = p_user_id
    order by e.created_at desc
    limit 1
  ) ld on true
  left join lateral (
    select s.id, s.title, s.amount, s.settled_at
    from settlements s
    where s.group_id = mg.group_id
      and s.from_user = p_user_id
    order by s.settled_at desc
    limit 1
  ) lsp on true
  left join lateral (
    select s.id, s.title, s.amount, s.settled_at
    from settlements s
    where s.group_id = mg.group_id
      and s.to_user = p_user_id
    order by s.settled_at desc
    limit 1
  ) lsr on true
$$;

GRANT ALL ON FUNCTION "public"."get_group_activities"("p_user_id" uuid) TO "anon";
GRANT ALL ON FUNCTION "public"."get_group_activities"("p_user_id" uuid) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_group_activities"("p_user_id" uuid) TO "service_role";
