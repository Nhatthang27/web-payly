<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useGroupList } from '@/modules/group/composables/useGroupList'
import { useGroupMemberBalances } from '@/modules/statistics/composables/useGroupMemberBalances'
import { useFinancialSummary } from '@/modules/statistics/composables/useFinancialSummary'
import AppHeader from '@/shared/components/app/AppHeader.vue'
import UserAvatar from '@/shared/components/ui/Avatar.vue'
import GroupList from '@/modules/group/components/group-list/GroupList.vue'
import GroupMemberBalancePanel from '@/modules/statistics/components/GroupMemberBalancePanel.vue'
import FinancialSummary from '@/modules/statistics/components/FinancialSummary.vue'
import Typography from '@/shared/components/ui/typography/Typography.vue'
import Button from '@/shared/components/ui/Button.vue'
import type { StatisticsRangePreset } from '@/modules/statistics/types/statistics.type'

const router = useRouter()
const auth = useAuthStore()
const groups = useGroupList()
const financialSummary = useFinancialSummary()

const statisticsPreset = ref<StatisticsRangePreset>('all-time')

const selectedGroupId = ref<string | undefined>()
watch(selectedGroupId, (val) => {
  console.log('[parent 2] selectedGroupId changed:', val)
})
const memberBalances = useGroupMemberBalances(selectedGroupId, statisticsPreset, () => !!selectedGroupId.value)

// Default the group selector to the user's first group once the list loads.
// (useGroupMemberBalances refetches on its own when groupId changes.)
watch(
  () => groups.data.value,
  (list) => {
    if (!selectedGroupId.value && list?.[0]) selectedGroupId.value = list[0].id
  },
  { immediate: true },
)

onMounted(() => {
  groups.query()
  financialSummary.query()
})
</script>

<template>
  <AppHeader>
    <template #left>
      <div class="flex items-center">
        <Button variant="ghost" @click="router.push('/profile')">
          <UserAvatar
            :src="auth.profile?.avatarUrl ?? auth.user?.user_metadata?.avatar_url"
            :name="auth.profile?.fullName ?? auth.user?.email"
            size="md"
          />
        </Button>
        <Typography weight="bold" size="lg">Nhóm của bạn</Typography>
      </div>
    </template>
  </AppHeader>

  <div class="p-8 space-y-8">
    <FinancialSummary
      :total-debt="financialSummary.data.value?.totalDebt ?? 0"
      :total-owed-to-me="financialSummary.data.value?.totalOwedToMe ?? 0"
      :total-balance="financialSummary.data.value?.totalBalance ?? 0"
    />

    <template v-if="groups.data.value?.length">
      <GroupMemberBalancePanel
        v-model:selected-group-id="selectedGroupId"
        :groups="groups.data.value"
        :balances="memberBalances.data.value ?? []"
        :is-pending="memberBalances.isPending.value"
      />
    </template>

    <GroupList />
  </div>
</template>
