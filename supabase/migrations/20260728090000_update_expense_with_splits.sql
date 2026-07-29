-- Lets the payer edit an expense they created: updates the expense row and
-- replaces its splits wholesale (delete all, then re-insert from the new
-- breakdown) rather than trying to diff/patch individual split rows.
CREATE OR REPLACE FUNCTION "public"."update_expense_with_splits"("p_expense_id" "uuid", "p_paid_by" "uuid", "p_title" "text", "p_amount" numeric, "p_expense_splits" "jsonb", "p_split_config" "jsonb", "p_split_method" "public"."expense_split_method_enum") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$DECLARE
  v_group_id uuid;
  v_split_count int;
  v_distinct_user_count int;
BEGIN
  -- Check auth
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT group_id INTO v_group_id FROM expenses WHERE id = p_expense_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  -- Current user must be group member
  IF NOT EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = v_group_id AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are not a member of this group';
  END IF;

  -- Payer must be group member
  IF NOT EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = v_group_id AND gm.user_id = p_paid_by
  ) THEN
    RAISE EXCEPTION 'Payer is not a member of this group';
  END IF;

  -- Basic validation
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  IF jsonb_typeof(p_expense_splits) <> 'array' OR jsonb_array_length(p_expense_splits) = 0 THEN
    RAISE EXCEPTION 'Splits must be a non-empty array';
  END IF;

  -- Validate duplicate users
  SELECT COUNT(*), COUNT(DISTINCT (split->>'user_id')::uuid)
  INTO v_split_count, v_distinct_user_count
  FROM jsonb_array_elements(p_expense_splits) split;

  IF v_split_count <> v_distinct_user_count THEN
    RAISE EXCEPTION 'Duplicate users in splits';
  END IF;

  -- Validate all split users are group members
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_expense_splits) split
    WHERE NOT EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = v_group_id AND gm.user_id = (split->>'user_id')::uuid
    )
  ) THEN
    RAISE EXCEPTION 'All split users must be group members';
  END IF;

  -- Validate split amount
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_expense_splits) split
    WHERE (split->>'share_amount')::numeric < 0
  ) THEN
    RAISE EXCEPTION 'Share amount must be greater than or equal to 0';
  END IF;

  -- An expense with a settled split already has money that changed hands
  -- against the old breakdown; editing it out from under that payment would
  -- silently corrupt the settlement history, so block it instead.
  IF EXISTS (
    SELECT 1 FROM expense_splits
    WHERE expense_id = p_expense_id AND settlement_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot update an expense that already has a settled split';
  END IF;

  -- Update expense
  UPDATE expenses
  SET paid_by = p_paid_by,
      title = p_title,
      amount = p_amount,
      split_method = p_split_method,
      split_config = p_split_config
  WHERE id = p_expense_id;

  -- Replace splits: delete all, then recreate from the new breakdown
  DELETE FROM expense_splits WHERE expense_id = p_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, share_amount)
  SELECT p_expense_id, (split->>'user_id')::uuid, (split->>'share_amount')::numeric
  FROM jsonb_array_elements(p_expense_splits) split;

  RETURN p_expense_id;
END;$$;

ALTER FUNCTION "public"."update_expense_with_splits"("p_expense_id" "uuid", "p_paid_by" "uuid", "p_title" "text", "p_amount" numeric, "p_expense_splits" "jsonb", "p_split_config" "jsonb", "p_split_method" "public"."expense_split_method_enum") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."update_expense_with_splits"("p_expense_id" "uuid", "p_paid_by" "uuid", "p_title" "text", "p_amount" numeric, "p_expense_splits" "jsonb", "p_split_config" "jsonb", "p_split_method" "public"."expense_split_method_enum") TO "anon";
GRANT ALL ON FUNCTION "public"."update_expense_with_splits"("p_expense_id" "uuid", "p_paid_by" "uuid", "p_title" "text", "p_amount" numeric, "p_expense_splits" "jsonb", "p_split_config" "jsonb", "p_split_method" "public"."expense_split_method_enum") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_expense_with_splits"("p_expense_id" "uuid", "p_paid_by" "uuid", "p_title" "text", "p_amount" numeric, "p_expense_splits" "jsonb", "p_split_config" "jsonb", "p_split_method" "public"."expense_split_method_enum") TO "service_role";
