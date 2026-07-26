import { settlementApi } from '@/modules/settlement/api/settlement.api'
import { useMutation } from '@/shared/lib/query/vue/useMutation'
import { useQueryClient } from '@/shared/lib/query/vue/useQueryClient'
import { useAuthStore } from '@/shared/stores/auth.store'
import { expenseListKey } from '@/modules/expense/composables/useExpenseList'
import { debtListKey } from '@/modules/expense/composables/useDebtList'
import { settlementListKey } from './useSettlementList'
import { groupActivitiesKey } from '@/modules/group/composables/useGroupActivities'

export interface SettleDebtsRequest {
  groupId: string
  splitIds: string[]
  /** Underlying expense ids of the settled debts, for detail-view cache invalidation. */
  expenseIds: string[]
  /** Storage path of an uploaded payment-proof image, stored on the created settlement(s). */
  evidenceImagePath?: string
}

/** Settles one or more of the current user's debts; resolves to the created settlement ids. */
export function useSettleDebts() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()

  return useMutation<string[], SettleDebtsRequest>({
    mutationFn: (payload) => settlementApi.settleDebts(payload.splitIds, payload.evidenceImagePath),
    onSuccess: (_settlementIds, payload) => {
      const userId = auth.profile?.id
      queryClient.invalidateQuery(debtListKey(payload.groupId, userId))
      queryClient.invalidateQuery(expenseListKey(payload.groupId, userId))
      queryClient.invalidateQuery(settlementListKey(payload.groupId, userId))
      queryClient.invalidateQuery(groupActivitiesKey(userId))
      payload.expenseIds.forEach((expenseId) => {
        queryClient.invalidateQuery(['debt-detail', expenseId, userId])
      })
    },
  })
}
