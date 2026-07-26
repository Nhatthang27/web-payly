<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardBody } from '@/shared/components/ui/card'
import AvatarStack from '@/shared/components/ui/AvatarStack.vue'
import type { GroupWithStats } from '@/modules/group/types/group.types'
import type { GroupActivity } from '@/modules/group/types/group-activity.type'
import { pickLatestGroupActivity, type GroupActivityKind } from '@/modules/group/utils/group-activity.util'
import Typography from '@/shared/components/ui/typography/Typography.vue'
import { useAppSettingStore } from '@/shared/stores/app-setting.store'
import { formatMoney } from '@/shared/utils/money.util'
import type { TypographyColor } from '@/shared/components/ui/typography/typography.type'

const props = defineProps<{ group: GroupWithStats; activity?: GroupActivity }>()
const emit = defineEmits<{ open: [] }>()
const { currency, locale } = useAppSettingStore()

const latestActivity = computed(() => pickLatestGroupActivity(props.activity))

const AMOUNT_COLOR: Record<GroupActivityKind, TypographyColor> = {
  expense: 'danger',
  debt: 'danger',
  settlementPaid: 'danger',
  settlementReceived: 'success',
}
const AMOUNT_SIGN: Record<GroupActivityKind, string> = {
  expense: '-',
  debt: '-',
  settlementPaid: '-',
  settlementReceived: '+',
}
</script>

<template>
  <Card clickable @click="emit('open')" class="max-w-160">
    <CardBody class="p-8">
      <div class="flex items-center gap-4">
        <div class="min-w-0 flex-1 flex flex-col">
          <Typography size="md" weight="semibold">{{ group.name }}</Typography>
          <AvatarStack :avatar-urls="group.memberAvatarUrls" size="xs" />
        </div>
        <div v-if="latestActivity" class="flex flex-col items-end">
          <Typography size="sm" weight="semibold" :color="AMOUNT_COLOR[latestActivity.kind]"
            >{{ AMOUNT_SIGN[latestActivity.kind]
            }}{{ formatMoney(latestActivity.amount, locale, currency) }}</Typography
          >
          <Typography size="xs" color="muted" weight="regular" as="div" truncate class="max-w-50">{{
            latestActivity.title
          }}</Typography>
        </div>
        <Typography v-else size="xs" color="muted" weight="regular" as="div">Chưa có hoạt động</Typography>
      </div>
    </CardBody>
  </Card>
</template>
