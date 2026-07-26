<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Typography from '@/shared/components/ui/typography/Typography.vue'
import { formatMoney } from '@/shared/utils/money.util'
import { useAppSettingStore } from '@/shared/stores/app-setting.store'
import { useGroupMemberBalances } from '@/modules/statistics/composables/useGroupMemberBalances'
import MemberBalanceChart from './MemberBalanceChart.vue'
import type { StatisticsRangePreset } from '@/modules/statistics/types/statistics.type'

const props = defineProps<{ groupId: string }>()

const appSetting = useAppSettingStore()
const preset = ref<StatisticsRangePreset>('all-time')
const {
  data: balances,
  isPending,
  query,
} = useGroupMemberBalances(
  computed(() => props.groupId),
  preset,
)

const totals = computed(() =>
  (balances.value ?? []).reduce(
    (acc, b) => ({ iOweThem: acc.iOweThem + b.iOweThem, theyOweMe: acc.theyOweMe + b.theyOweMe }),
    { iOweThem: 0, theyOweMe: 0 },
  ),
)

onMounted(() => {
  query()
})
</script>

<template>
  <main class="flex flex-col gap-sm p-8">
    <Typography size="md" weight="semibold">Công nợ</Typography>

    <div v-if="isPending" class="balance-skeleton" />
    <template v-else-if="balances?.length">
      <div class="stat-tiles">
        <div class="stat-tile">
          <span class="stat-label">Bạn nợ nhóm này</span>
          <span class="stat-value stat-value--danger">
            {{ formatMoney(totals.iOweThem, appSetting.locale, appSetting.currency) }}
          </span>
        </div>
        <div class="stat-tile">
          <span class="stat-label">Nhóm này nợ bạn</span>
          <span class="stat-value stat-value--success">
            {{ formatMoney(totals.theyOweMe, appSetting.locale, appSetting.currency) }}
          </span>
        </div>
      </div>

      <MemberBalanceChart :balances="balances" />
    </template>
    <Typography v-else size="sm" color="muted" class="py-8 text-center">Không có công nợ trong nhóm này</Typography>
  </main>
</template>

<style scoped>
.stat-tiles {
  display: flex;
  gap: var(--spacing-sm);
}

.stat-tile {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-weight: 450;
  line-height: 1.3;
}

.stat-value {
  font-size: var(--text-md);
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value--danger {
  color: var(--color-error);
}

.stat-value--success {
  color: var(--color-success);
}

.balance-skeleton {
  height: 160px;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-layout);
}
</style>
