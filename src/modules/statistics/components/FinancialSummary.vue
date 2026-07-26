<script setup lang="ts">
import { computed } from 'vue'
import Typography from '@/shared/components/ui/typography/Typography.vue'
import { Scale, type LucideIcon } from 'lucide-vue-next'
import { formatMoney } from '@/shared/utils/money.util'
import { useAppSettingStore } from '@/shared/stores/app-setting.store'
import type { TypographyColor } from '@/shared/components/ui/typography/typography.type'

const props = defineProps<{
  totalOwedToMe: number
  totalDebt: number
  totalBalance: number
}>()

const appSetting = useAppSettingStore()

type SummaryTone = 'neutral' | 'success' | 'danger'

interface SummaryItem {
  label: string
  value: number
  icon: LucideIcon
  tone: SummaryTone
}

const toneColor: Record<SummaryTone, TypographyColor> = {
  neutral: 'main',
  success: 'success',
  danger: 'danger',
}

const summaryItems = computed<SummaryItem[]>(() => [
  // { label: 'Mọi người nợ bạn', value: props.totalOwedToMe, icon: ArrowUpCircle, tone: 'success' },
  // { label: 'Bạn đang nợ', value: props.totalDebt, icon: ArrowDownCircle, tone: 'danger' },
  { label: 'Số dư ròng', value: props.totalBalance, icon: Scale, tone: 'neutral' },
])
</script>

<template>
  <main v-for="item in summaryItems" :key="item.label" class="flex flex-col items-start p-4">
    <Typography size="sm" weight="semibold" as="div">{{ item.label }}</Typography>
    <Typography size="xl" weight="bold" as="div" :color="toneColor[item.tone]">
      {{ formatMoney(item.value, appSetting.locale, appSetting.currency) }}
    </Typography>
  </main>
</template>
