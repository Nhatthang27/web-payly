<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExpenseCard from './expense-card/ExpenseCard.vue'
import ExpenseCardSkeleton from './expense-card/ExpenseCardSkeleton.vue'
import AppEmpty from '@/shared/components/app/AppEmpty.vue'
import Typography from '@/shared/components/ui/typography/Typography.vue'
import { useExpenseList } from '@/modules/expense/composables/useExpenseList'
import AppFab from '@/shared/components/app/AppFab.vue'
import { Receipt } from 'lucide-vue-next'

const props = defineProps<{ groupId: string }>()
const router = useRouter()
const route = useRoute()

const { data: expenses, isPending, query: fetchExpenses } = useExpenseList(props.groupId)

function openDetail(expenseId: string) {
  router.push(`/groups/${props.groupId}/expenses/${expenseId}`)
}

function goToCreateExpense() {
  router.push(`/groups/${route.params.id}/expenses/new`)
}
onMounted(() => fetchExpenses())
</script>

<template>
  <Typography size="md" weight="semibold" class="p-sm" as="div">Khoản chi</Typography>
  <div class="flex flex-col gap-sm px-sm mb-4">
    <template v-if="isPending">
      <ExpenseCardSkeleton v-for="i in 4" :key="i" />
    </template>
    <template v-else-if="expenses?.length">
      <ExpenseCard v-for="e in expenses" :key="e.id" :expense="e" @detail="openDetail" class="" />
    </template>
    <template v-else>
      <div class="flex flex-col items-center gap-2 py-48">
        <AppEmpty size="lg" />
        <Typography size="sm" color="muted">Chưa có khoản chi nào</Typography>
      </div>
    </template>
  </div>
  <AppFab :icon="Receipt" @click="goToCreateExpense" mask="false" maskClosable="false" />
</template>
