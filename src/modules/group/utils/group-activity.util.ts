import type { GroupActivity, GroupActivityItem } from '@/modules/group/types/group-activity.type'

export type GroupActivityKind = 'expense' | 'debt' | 'settlementPaid' | 'settlementReceived'

export interface LatestGroupActivity extends GroupActivityItem {
  kind: GroupActivityKind
}

/** Picks whichever of a group's expense/debt/settlement activity happened most recently. */
export function pickLatestGroupActivity(activity: GroupActivity | undefined | null): LatestGroupActivity | null {
  if (!activity) return null

  const candidates: { kind: GroupActivityKind; item: GroupActivityItem | null }[] = [
    { kind: 'expense', item: activity.latestExpense },
    { kind: 'debt', item: activity.latestDebt },
    { kind: 'settlementPaid', item: activity.latestSettlementPaid },
    { kind: 'settlementReceived', item: activity.latestSettlementReceived },
  ]

  return candidates
    .filter((c): c is { kind: GroupActivityKind; item: GroupActivityItem } => c.item !== null)
    .reduce<LatestGroupActivity | null>((latest, c) => {
      if (!latest || c.item.occurredAt > latest.occurredAt) return { ...c.item, kind: c.kind }
      return latest
    }, null)
}
