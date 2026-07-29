import { expenseApi } from '@/modules/expense/api/expense.api'
import type { UpdateExpenseRequest } from '@/modules/expense/api/expense.api'
import { useMutation } from '@/shared/lib/query/vue/useMutation'
import { useQueryClient } from '@/shared/lib/query/vue/useQueryClient'
import { useAuthStore } from '@/shared/stores/auth.store'
import { expenseListKey } from './useExpenseList'
import { debtListKey } from './useDebtList'

/** Updates an expense the current user paid, replacing its splits; resolves to the expense id. */
export function useUpdateExpense() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()

  return useMutation<string, UpdateExpenseRequest>({
    mutationFn: (payload) => expenseApi.updateExpenseWithSplits(payload),
    onSuccess: (_id, payload) => {
      // The edited expense changes both what the user is owed and what they owe in this group,
      // plus the detail views for this specific expense/debt.
      const userId = auth.profile?.id
      queryClient.invalidateQuery(expenseListKey(payload.groupId, userId))
      queryClient.invalidateQuery(debtListKey(payload.groupId, userId))
      queryClient.invalidateQuery(['expense-detail', payload.expenseId, userId])
      queryClient.invalidateQuery(['debt-detail', payload.expenseId, userId])
    },
  })
}
