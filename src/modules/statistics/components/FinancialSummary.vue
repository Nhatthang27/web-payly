<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardBody } from '@/shared/components/ui/card'
import Typography from '@/shared/components/ui/typography/Typography.vue'
import { ArrowUpCircle, ArrowDownCircle, Scale, type LucideIcon } from 'lucide-vue-next'
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
  { label: 'Mọi người nợ bạn', value: props.totalOwedToMe, icon: ArrowUpCircle, tone: 'success' },
  { label: 'Bạn đang nợ', value: props.totalDebt, icon: ArrowDownCircle, tone: 'danger' },
  { label: 'Số dư ròng', value: props.totalBalance, icon: Scale, tone: props.totalBalance >= 0 ? 'success' : 'danger' },
])
</script>

<template>
  <Card class="financial-summary">
    <CardBody class="grid grid-cols-1 gap-sm p-8 sm:grid-cols-3">
      <div v-for="item in summaryItems" :key="item.label" class="summary-tile">
        <div class="summary-icon" :class="`summary-icon--${item.tone}`">
          <component :is="item.icon" :size="20" />
        </div>
        <div class="flex flex-col gap-1">
          <Typography size="xs" color="muted">{{ item.label }}</Typography>
          <Typography size="lg" weight="bold" :color="toneColor[item.tone]">
            {{ formatMoney(item.value, appSetting.locale, appSetting.currency) }}
          </Typography>
        </div>
      </div>
    </CardBody>
  </Card>
</template>

<style scoped>
.summary-tile {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-round);
}

.summary-icon--neutral {
  background-color: var(--color-bg-layout);
  color: var(--color-text-secondary);
}

.summary-icon--success {
  background-color: color-mix(in srgb, var(--color-success) 15%, transparent);
  color: var(--color-success);
}

.summary-icon--danger {
  background-color: color-mix(in srgb, var(--color-error) 15%, transparent);
  color: var(--color-error);
}
</style>
