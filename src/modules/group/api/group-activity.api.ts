import { supabase } from '@/shared/lib/supabase'
import type { QueryData } from '@supabase/supabase-js'
import type { GroupActivity, GroupActivityItem } from '@/modules/group/types/group-activity.type'

/** Builds the group-activities RPC call so its row type can be inferred. */
function groupActivitiesQuery(userId: string) {
  return supabase.rpc('get_group_activities', {
    p_user_id: userId,
  })
}
type GroupActivityRow = QueryData<ReturnType<typeof groupActivitiesQuery>>[number]

function toActivityItem(
  id: string | null,
  title: string | null,
  amount: number | null,
  occurredAt: string | null,
): GroupActivityItem | null {
  if (!id || !occurredAt) return null
  return { id, title: title ?? '', amount: amount ?? 0, occurredAt }
}

function mapGroupActivity(row: GroupActivityRow): GroupActivity {
  return {
    groupId: row.group_id,
    latestExpense: toActivityItem(
      row.latest_expense_id,
      row.latest_expense_title,
      row.latest_expense_amount,
      row.latest_expense_at,
    ),
    latestDebt: toActivityItem(
      row.latest_debt_expense_id,
      row.latest_debt_title,
      row.latest_debt_amount,
      row.latest_debt_at,
    ),
    latestSettlementPaid: toActivityItem(
      row.latest_settlement_paid_id,
      row.latest_settlement_paid_title,
      row.latest_settlement_paid_amount,
      row.latest_settlement_paid_at,
    ),
    latestSettlementReceived: toActivityItem(
      row.latest_settlement_received_id,
      row.latest_settlement_received_title,
      row.latest_settlement_received_amount,
      row.latest_settlement_received_at,
    ),
  }
}

export const groupActivityApi = {
  /** Fetches, for every group the user belongs to, their latest created expense, latest shared debt, and latest settlement. */
  async fetchGroupActivities(userId: string): Promise<GroupActivity[]> {
    const { data, error } = await groupActivitiesQuery(userId)
    if (error) throw error
    return data.map(mapGroupActivity)
  },
}
