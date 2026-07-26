<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupList } from '@/modules/group/composables/useGroupList'
import { useGroupActivities } from '@/modules/group/composables/useGroupActivities'
import GroupCard from '@/modules/group/components/group-card/GroupCard.vue'
import GroupCardSkeleton from '@/modules/group/components/group-card/GroupCardSkeleton.vue'
import GroupCreateModal from '@/modules/group/components/group-create-modal/GroupCreateModal.vue'
import AppFab from '@/shared/components/app/AppFab.vue'
import { HousePlus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Group } from '@/modules/group/types/group.types'
import { GROUP_MESSAGES } from '@/modules/group/components/group-detail/group-detail.constants'

const router = useRouter()
const groups = useGroupList()
const activities = useGroupActivities()
const activityByGroupId = computed(() => new Map(activities.data.value?.map((a) => [a.groupId, a])))
const showCreateModal = ref(false)

function handleCreateSuccess(group: Group) {
  showCreateModal.value = false
  groups.query()
  toast.success(GROUP_MESSAGES.CREATE_SUCCESS, { description: group.name })
}

function handleCreateError(error: Error) {
  toast.error('Có lỗi xảy ra khi tạo nhóm', { description: error.message })
}

onMounted(() => {
  groups.query()
})
</script>

<template>
  <main class="groups-grid">
    <template v-if="groups.isPending.value">
      <GroupCardSkeleton v-for="i in 6" :key="i" />
    </template>
    <template v-else>
      <GroupCard
        v-for="group in groups.data.value"
        :key="group.id"
        :group="group"
        :activity="activityByGroupId.get(group.id)"
        @open="router.push(`/groups/${group.id}`)"
      />
    </template>
  </main>

  <AppFab :icon="HousePlus" aria-label="Tạo nhóm mới" @click="showCreateModal = true" />

  <GroupCreateModal
    :open="showCreateModal"
    @close="showCreateModal = false"
    @success="handleCreateSuccess"
    @error="handleCreateError"
  />
</template>

<style scoped>
.groups-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xs);
}

@media (min-width: 768px) {
  .groups-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .groups-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
