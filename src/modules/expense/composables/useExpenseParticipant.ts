import { useGroupMemberList } from '@/modules/group-member/composables/useGroupMemberList'
import { useAuthStore } from '@/shared/stores/auth.store'
import { computed, ref, watch, type Ref } from 'vue'
import {
  type ExpenseParticipantMap,
  groupMemberToExpenseParticipant,
  type ExpenseParticipant,
} from '../types/expense-participant.type'

export function useExpenseParticipants(
  groupId: string,
  payerId: Ref<string>,
  options?: { autoSelectCurrentUser?: boolean },
) {
  const { data: members, query: fetchMembers } = useGroupMemberList(groupId)
  const auth = useAuthStore()
  const autoSelectCurrentUser = options?.autoSelectCurrentUser ?? true

  const participants = computed<ExpenseParticipant[]>(() => members.value?.map(groupMemberToExpenseParticipant) ?? [])
  const participantsMap = computed<ExpenseParticipantMap>(() =>
    Object.fromEntries(members.value?.map((member) => [member.id, groupMemberToExpenseParticipant(member)]) ?? []),
  )
  const payeeIds = ref<string[]>([])
  const payer = computed<ExpenseParticipant | undefined>(() =>
    payerId.value ? participantsMap.value[payerId.value] : undefined,
  )
  const payees = computed<ExpenseParticipant[]>(() =>
    payeeIds.value.flatMap((id) => {
      const m = participantsMap.value[id]
      return m ? [m] : []
    }),
  )

  // New expenses default to "I paid, split with myself"; editing an existing
  // expense prefills payer/payees from its own data instead, so callers opt out.
  watch(
    () => auth.profile,
    (p) => {
      if (!p || !autoSelectCurrentUser) return
      payerId.value = p.id
      payeeIds.value = [p.id]
    },
    { immediate: true },
  )

  return { participants, participantsMap, payer, payees, payeeIds, fetchMembers }
}
