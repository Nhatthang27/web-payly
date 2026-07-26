<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useGroupList } from '@/modules/group/composables/useGroupList'
import { useFinancialSummary } from '@/modules/statistics/composables/useFinancialSummary'
import UserAvatar from '@/shared/components/ui/Avatar.vue'
import GroupList from '@/modules/group/components/group-list/GroupList.vue'
import Typography from '@/shared/components/ui/typography/Typography.vue'
import Button from '@/shared/components/ui/Button.vue'
import AppHeader from '@/shared/components/app/AppHeader.vue'

const router = useRouter()
const auth = useAuthStore()
const groups = useGroupList()
const financialSummary = useFinancialSummary()

onMounted(() => {
  groups.query()
  financialSummary.query()
})
</script>

<template>
  <AppHeader>
    <template #left>
      <Typography weight="bold" size="lg" truncate>Hi, {{ auth.profile?.fullName ?? 'Unknown' }}</Typography>
    </template>
    <template #right>
      <Button variant="ghost" class="p-0" @click="router.push('/profile')">
        <UserAvatar
          :src="auth.profile?.avatarUrl ?? auth.user?.user_metadata?.avatar_url"
          :name="auth.profile?.fullName ?? auth.user?.email"
          size="md"
        />
      </Button>
    </template>
  </AppHeader>

  <div class="p-8 space-y-8">
    <GroupList />
  </div>
</template>
