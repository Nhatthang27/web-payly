import type { ExpenseParticipant } from '@/modules/expense/types/expense-participant.type'

export type StatisticsRangePreset = 'this-month' | 'last-3-months' | 'all-time'

/** Breakdown of one other group member's balance with the current user, for a single group. */
export interface GroupMemberBalance {
  member: ExpenseParticipant
  /** The current user's outstanding share of expenses this member paid. */
  iOweThem: number
  /** This member's outstanding share of expenses the current user paid. */
  theyOweMe: number
}

/** The current user's financial position across every group they belong to. */
export interface FinancialSummary {
  /** Total money others owe the user, across all groups. */
  totalOwedToMe: number
  /** What the user currently owes, across all groups. */
  totalDebt: number
  /** Net balance: what's owed to the user minus what the user owes. */
  totalBalance: number
}
