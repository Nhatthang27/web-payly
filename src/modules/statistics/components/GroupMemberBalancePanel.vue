<script setup lang="ts">
import { computed, watch } from 'vue'
import { Card, CardBody } from '@/shared/components/ui/card'
import { Dropdown } from '@/shared/components/ui/dropdown'
import type { DropdownOption } from '@/shared/components/ui/dropdown/dropdown.type'
import Button from '@/shared/components/ui/Button.vue'
import Typography from '@/shared/components/ui/typography/Typography.vue'
import { ChevronDown } from 'lucide-vue-next'
import { formatMoney } from '@/shared/utils/money.util'
import { useAppSettingStore } from '@/shared/stores/app-setting.store'
import MemberBalanceChart from './MemberBalanceChart.vue'
import type { GroupWithStats } from '@/modules/group/types/group.types'
import type { GroupMemberBalance } from '@/modules/statistics/types/statistics.type'

const props = defineProps<{
  groups: GroupWithStats[]
  balances: GroupMemberBalance[]
  isPending: boolean
}>()
const selectedGroupId = defineModel<string | undefined>('selectedGroupId')
watch(selectedGroupId, (val) => {
  console.log('[parent] selectedGroupId changed:', val)
})

const appSetting = useAppSettingStore()

const groupOptions = computed<DropdownOption[]>(() => props.groups.map((g) => ({ key: g.id, label: g.name })))
const selectedGroupName = computed(() => props.groups.find((g) => g.id === selectedGroupId.value)?.name ?? 'Chọn nhóm')

// Bridges the model's `string | undefined` to the Dropdown's plain `string` model.
const groupKey = computed<string>({
  get: () => selectedGroupId.value ?? '',
  set: (key) => {
    console.log('[groupKey] setter called with:', key)
    selectedGroupId.value = key || undefined
  },
})

const totals = computed(() =>
  props.balances.reduce((acc, b) => ({ iOweThem: acc.iOweThem + b.iOweThem, theyOweMe: acc.theyOweMe + b.theyOweMe }), {
    iOweThem: 0,
    theyOweMe: 0,
  }),
)
</script>

<template>
  <Card>
    <CardBody class="flex flex-col gap-sm p-8">
      <div class="flex items-center justify-between">
        <Typography size="md" weight="semibold">Công nợ theo nhóm</Typography>
        <Dropdown v-model:selected-key="groupKey" :options="groupOptions" placement="bottom-end" size="sm">
          <template #trigger>
            <Button variant="outline" size="sm">
              {{ selectedGroupName }}
              <ChevronDown :size="16" />
            </Button>
          </template>
        </Dropdown>
      </div>

      <div v-if="isPending" class="balance-skeleton" />
      <template v-else-if="balances.length">
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
    </CardBody>
  </Card>
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
