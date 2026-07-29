<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Pencil } from 'lucide-vue-next'
import AppHeader from '@/shared/components/app/AppHeader.vue'
import Button from '@/shared/components/ui/Button.vue'
import { Card, CardBody } from '@/shared/components/ui/card'
import ParticipantLabel from '@/modules/expense/components/ParticipantLabel.vue'
import Tag, { type TagColor } from '@/shared/components/ui/Tag.vue'
import { useExpenseDetail } from '@/modules/expense/composables/useExpenseDetail'
import type { SettlementStatus } from '@/modules/expense/types/expense.type'
import { formatDate } from '@/shared/utils/datetime.util'
import { useAppSettingStore } from '@/shared/stores/app-setting.store'
import { formatMoney } from '@/shared/utils/money.util'
import Typography from '@/shared/components/ui/typography/Typography.vue'
import Skeleton from '@/shared/components/ui/Skeleton.vue'

const route = useRoute()
const router = useRouter()
const appSetting = useAppSettingStore()

const { data: expense, isPending, query: fetchExpense } = useExpenseDetail(route.params.expenseId as string)
const settledCount = computed(() => expense.value?.debtors.filter((d) => d.status === 'paid').length ?? 0)

function statusConfig(status: SettlementStatus): { label: string; color: TagColor } {
  return status === 'paid' ? { label: 'Đã trả', color: 'success' } : { label: 'Chưa trả', color: 'default' }
}

watch(expense, () => {
  console.log('expense', expense.value)
})
onMounted(() => fetchExpense())

function back() {
  router.back()
}

function editExpense() {
  router.push({ name: 'ExpenseEdit', params: { id: route.params.id, expenseId: route.params.expenseId } })
}
</script>

<template>
  <div class="min-h-svh bg-bg-base">
    <AppHeader>
      <template #left>
        <Button variant="ghost" size="xs" aria-label="Quay lại" @click="back">
          <ArrowLeft :size="24" :strokeWidth="2" />
        </Button>
      </template>
      <template #center>
        <Typography size="md" weight="semibold"> Chi tiết khoản chi </Typography>
      </template>
      <template #right>
        <Button variant="ghost" size="xs" aria-label="Sửa khoản chi" @click="editExpense">
          <Pencil :size="20" :strokeWidth="2" />
        </Button>
      </template>
    </AppHeader>

    <main v-if="isPending" class="flex flex-col gap-4 p-sm pb-3xl">
      <!-- Skeleton: summary -->
      <Card>
        <CardBody class="flex flex-col gap-4 p-6">
          <Skeleton width="60%" height="5.25rem" />
          <Skeleton width="40%" height="5.25rem" />
        </CardBody>
      </Card>

      <!-- Skeleton: breakdown -->
      <Card>
        <CardBody class="p-6">
          <Skeleton width="8rem" height="4.75rem" />
        </CardBody>
      </Card>
    </main>

    <main v-else-if="expense" class="flex flex-col gap-4 p-sm pb-3xl">
      <!-- Summary -->
      <Card>
        <CardBody class="flex flex-col gap-4 p-6">
          <div>
            <Typography size="md" weight="bold" as="div">{{ expense.title }}</Typography>
            <Typography size="xs" color="muted"
              >Bạn đã trả · {{ formatDate(expense.paidAt, appSetting.locale) }}</Typography
            >
          </div>

          <div class="flex items-end justify-between">
            <div>
              <Typography size="xs" color="muted" as="div">Tổng đã trả</Typography>
              <Typography size="lg" weight="bold">
                {{ formatMoney(expense.totalAmount, appSetting.locale, appSetting.currency) }}
              </Typography>
            </div>
            <div class="text-right">
              <Typography size="xs" color="muted" as="div">Còn được nợ</Typography>
              <Typography size="lg" weight="bold" color="success">
                {{ formatMoney(expense.amountOwedToMe, appSetting.locale, appSetting.currency) }}
              </Typography>
            </div>
          </div>
        </CardBody>
      </Card>

      <!-- Breakdown -->
      <Card>
        <CardBody class="flex flex-col p-6">
          <Typography size="xs" weight="semibold" color="muted" class="mb-2 uppercase tracking-wide">
            Chia cho · {{ settledCount }}/{{ expense.debtors.length }} đã trả
          </Typography>
          <div
            v-for="(share, i) in expense.debtors"
            :key="share.participant.id"
            class="flex items-center justify-between gap-3 py-3"
            :class="{ 'border-t border-border': i > 0 }"
          >
            <ParticipantLabel :name="share.participant.name" :avatar-url="share.participant.avatarUrl" />
            <div class="flex shrink-0 items-center gap-3">
              <Tag :color="statusConfig(share.status).color" variant="filled">{{
                statusConfig(share.status).label
              }}</Tag>
              <Typography weight="semibold" as="div" color="danger">
                {{ formatMoney(share.amount, appSetting.locale, appSetting.currency) }}
              </Typography>
            </div>
          </div>
        </CardBody>
      </Card>
    </main>

    <Typography v-else size="sm" color="muted" align="center" class="p-lg block">Không tìm thấy khoản chi.</Typography>
  </div>
</template>
