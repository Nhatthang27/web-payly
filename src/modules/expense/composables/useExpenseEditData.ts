import { expenseApi } from '@/modules/expense/api/expense.api'
import { useQuery } from '@/shared/lib/query/vue/useQuery'
import { useAuthStore } from '@/shared/stores/auth.store'

/** Full editable state of one of the current user's paid expenses, for prefilling the edit form. */
export function useExpenseEditData(expenseId: string) {
  const auth = useAuthStore()
  return useQuery({
    queryKey: ['expense-edit-data', expenseId, auth.profile?.id],
    queryFn: () => {
      const userId = auth.profile?.id
      if (!userId) throw new Error('Chưa đăng nhập')
      return expenseApi.fetchExpenseEditData(expenseId, userId)
    },
  })
}
