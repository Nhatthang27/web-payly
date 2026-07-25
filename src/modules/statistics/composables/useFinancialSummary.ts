import { statisticsApi } from '@/modules/statistics/api/statistics.api'
import { useQuery } from '@/shared/lib/query/vue/useQuery'
import { useAuthStore } from '@/shared/stores/auth.store'
import type { FinancialSummary } from '@/modules/statistics/types/statistics.type'

/** Cache key for the current user's financial summary. */
export const financialSummaryKey = (userId: string | undefined) => ['financial-summary', userId]

/** The current user's total spend, outstanding debt, and net balance across all groups. */
export function useFinancialSummary() {
  const auth = useAuthStore()

  return useQuery<FinancialSummary>({
    queryKey: financialSummaryKey(auth.profile?.id),
    queryFn: () => statisticsApi.fetchFinancialSummary(),
  })
}
