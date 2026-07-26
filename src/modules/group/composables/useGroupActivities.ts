import { groupActivityApi } from '@/modules/group/api/group-activity.api'
import { useQuery } from '@/shared/lib/query/vue/useQuery'
import { useAuthStore } from '@/shared/stores/auth.store'
import type { GroupActivity } from '@/modules/group/types/group-activity.type'

/** Cache key for the current user's latest activity across all their groups. */
export const groupActivitiesKey = (userId: string | undefined) => ['group-activities', userId]

/** The current user's latest expense, debt, and settlement activity for each group they belong to. */
export function useGroupActivities() {
  const auth = useAuthStore()

  return useQuery<GroupActivity[]>({
    queryKey: () => groupActivitiesKey(auth.profile?.id),
    queryFn: () => groupActivityApi.fetchGroupActivities(auth.profile!.id),
    enable: () => !!auth.profile?.id,
  })
}
