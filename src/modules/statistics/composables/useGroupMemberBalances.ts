import { computed, type MaybeRefOrGetter, type Ref } from 'vue'
import { statisticsApi } from '@/modules/statistics/api/statistics.api'
import { useQuery } from '@/shared/lib/query/vue/useQuery'
import { useAuthStore } from '@/shared/stores/auth.store'
import type { StatisticsRangePreset, GroupMemberBalance } from '@/modules/statistics/types/statistics.type'

export const groupMemberBalancesKey = (groupId: string, userId: string) => ['group-member-balances', groupId, userId]
export function useGroupMemberBalances(
  groupId: Ref<string | undefined>,
  preset: Ref<StatisticsRangePreset>,
  enable?: MaybeRefOrGetter<boolean>,
) {
  const auth = useAuthStore()
  if (!auth.profile) throw Error('You must login first!')
  const queryKey = computed(() => groupMemberBalancesKey(groupId.value ?? 'no-id', auth.profile!.id))

  const result = useQuery<GroupMemberBalance[]>({
    queryKey: queryKey,
    queryFn: () => {
      const id = groupId.value
      if (!id) throw new Error('Chưa chọn nhóm')
      return statisticsApi.fetchGroupMemberBalances(id, preset.value)
    },
    enable,
  })

  return result
}
