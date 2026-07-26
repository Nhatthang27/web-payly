export interface GroupActivityItem {
  id: string
  title: string
  amount: number
  occurredAt: string
}

/** A group's latest activity of each kind, for the current user. Any of these can be null if it hasn't happened yet. */
export interface GroupActivity {
  groupId: string
  latestExpense: GroupActivityItem | null
  latestDebt: GroupActivityItem | null
  /** Latest settlement the user paid to someone else in this group. */
  latestSettlementPaid: GroupActivityItem | null
  /** Latest settlement someone else paid to the user in this group. */
  latestSettlementReceived: GroupActivityItem | null
}
