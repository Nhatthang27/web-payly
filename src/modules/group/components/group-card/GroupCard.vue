<script setup lang="ts">
import { HouseIcon } from 'lucide-vue-next'
import { Card, CardBody } from '@/shared/components/ui/card'
import AvatarStack from '@/shared/components/ui/AvatarStack.vue'
import type { GroupWithStats } from '@/modules/group/types/group.types'
import Typography from '@/shared/components/ui/typography/Typography.vue'

defineProps<{ group: GroupWithStats }>()
const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <Card clickable @click="emit('open')" class="max-w-140">
    <CardBody class="p-8">
      <div class="flex items-center gap-4">
        <div class="bg-bg-base p-6 rounded-md">
          <HouseIcon :size="24" :stroke-width="2" />
        </div>
        <div class="min-w-0 flex-1">
          <Typography size="md" weight="semibold">{{ group.name }}</Typography>
          <AvatarStack :avatar-urls="group.memberAvatarUrls" size="xs" />
        </div>
      </div>
    </CardBody>
  </Card>
</template>
