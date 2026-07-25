import { supabase } from '@/shared/lib/supabase'
import type { QueryData } from '@supabase/supabase-js'
import type {
  StatisticsRangePreset,
  GroupMemberBalance,
  FinancialSummary,
} from '@/modules/statistics/types/statistics.type'

/** Builds the financial-summary RPC call so its row type can be inferred. */
function userFinancialSummaryQuery() {
  return supabase.rpc('get_user_financial_summary')
}
type UserFinancialSummaryRow = QueryData<ReturnType<typeof userFinancialSummaryQuery>>[number]

/** Builds the member-balances RPC call for a single group, so its row type can be inferred. */
function groupMemberBalancesQuery(groupId: string, from: string | null, to: string | null) {
  return supabase.rpc('get_group_member_balances', {
    p_group_id: groupId,
    p_from: from ?? undefined,
    p_to: to ?? undefined,
  })
}
type GroupMemberBalanceRow = QueryData<ReturnType<typeof groupMemberBalancesQuery>>[number]

/** Resolves a UI date-range preset to the `[from, to)` bounds the RPC expects; `to` stays open-ended (now). */
function dateRangeForPreset(preset: StatisticsRangePreset): { from: string | null; to: string | null } {
  if (preset === 'all-time') return { from: null, to: null }

  const from = new Date()
  from.setHours(0, 0, 0, 0)
  if (preset === 'this-month') {
    from.setDate(1)
  } else {
    from.setMonth(from.getMonth() - 3)
  }
  return { from: from.toISOString(), to: null }
}

function mapGroupMemberBalance(row: GroupMemberBalanceRow): GroupMemberBalance {
  return {
    member: {
      id: row.user_id,
      name: row.full_name ?? '',
      avatarUrl: row.avatar_url,
    },
    iOweThem: row.i_owe_them,
    theyOweMe: row.they_owe_me,
  }
}

function mapFinancialSummary(row: UserFinancialSummaryRow): FinancialSummary {
  return {
    totalOwedToMe: row.total_owed,
    totalDebt: row.total_debt,
    totalBalance: row.total_balance,
  }
}

export const statisticsApi = {
  /** Fetches, for one group, how much the caller owes each other member and how much each owes back. */
  async fetchGroupMemberBalances(groupId: string, preset: StatisticsRangePreset): Promise<GroupMemberBalance[]> {
    const { from, to } = dateRangeForPreset(preset)
    const { data, error } = await groupMemberBalancesQuery(groupId, from, to)
    if (error) throw error
    return data.map(mapGroupMemberBalance)
  },

  /** Fetches the current user's total spend, outstanding debt, and net balance across all groups. */
  async fetchFinancialSummary(): Promise<FinancialSummary> {
    const { data, error } = await userFinancialSummaryQuery()
    if (error) throw error
    // get_user_financial_summary always returns exactly one row (zero-filled if no groups).
    return mapFinancialSummary(data[0]!)
  },
}
