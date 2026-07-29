<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useForm, useField } from 'vee-validate'
import PayerSelectRow from '@/modules/expense/components/expense-create/PayerSelectRow.vue'
import PayerPickerModal from '@/modules/expense/components/expense-create/PayerPickerModal.vue'
import PayeeSelectRow from '@/modules/expense/components/expense-create/PayeeSelectRow.vue'
import PayeePickerModal from '@/modules/expense/components/expense-create/PayeePickerModal.vue'
import ExpenseSplitBreakdown from '@/modules/expense/components/expense-create/expense-split-breakdown/ExpenseSplitBreakdown.vue'
import { expenseCreateSchema, type ExpenseSplit } from '@/modules/expense/schema/expense-create.schema'
import { useUpdateExpense } from '@/modules/expense/composables/useUpdateExpense'
import { useExpenseEditData } from '@/modules/expense/composables/useExpenseEditData'
import { useSplitExpense } from '../composables/useSplitExpense'
import { useExpenseParticipants } from '../composables/useExpenseParticipant'
import ExpenseCreateHeader from '../components/expense-create/ExpenseCreateHeader.vue'
import { useAppSettingStore } from '@/shared/stores/app-setting.store.ts'
import Label from '@/shared/components/ui/Label.vue'
import MoneyInput from '@/shared/components/ui/MoneyInput.vue'
import Input from '@/shared/components/ui/Input.vue'

const route = useRoute()
const router = useRouter()
const groupId = route.params.id as string
const expenseId = route.params.expenseId as string
const appSetting = useAppSettingStore()

const { handleSubmit: handleUpdateExpense, errors } = useForm({
  validationSchema: expenseCreateSchema,
  initialValues: {
    title: '',
    amount: 0,
    paidBy: '',
    splits: [] as ExpenseSplit[],
  },
})
const { value: title } = useField<string>('title')
const { value: totalAmount } = useField<number>('amount')
const { value: payerId } = useField<string>('paidBy')
const { value: splitsField } = useField<ExpenseSplit[]>('splits')

// Editing prefills payer/payees from the expense itself, so skip the "I paid, split with myself" default.
const { participants, participantsMap, payer, payees, payeeIds, fetchMembers } = useExpenseParticipants(
  groupId,
  payerId,
  { autoSelectCurrentUser: false },
)

const { splitMethod, customAmountMap, percentageMap, splitConfig, splits, splitTotal } = useSplitExpense(
  totalAmount,
  payeeIds,
)

const {
  data: expenseEditData,
  isPending: isExpenseLoading,
  query: fetchExpenseEditData,
} = useExpenseEditData(expenseId)

const {
  mutate: updateExpense,
  isPending: isExpenseUpdating,
  isSuccess: isExpenseUpdated,
  isError: isExpenseUpdateError,
  error: expenseUpdateError,
} = useUpdateExpense()

const onSubmit = handleUpdateExpense(async (values) => {
  await updateExpense({
    expenseId,
    groupId,
    title: values.title.trim(),
    amount: values.amount,
    paidBy: values.paidBy,
    splitMethod: splitMethod.value,
    splitConfig: splitConfig.value,
    splits: splits.value,
  })

  if (isExpenseUpdated.value) {
    toast.success('Đã cập nhật khoản chi', { description: values.title.trim() })
    router.back()
  } else if (isExpenseUpdateError.value) {
    toast.error('Không thể cập nhật khoản chi', { description: expenseUpdateError?.value?.message })
  }
})

const showPayerPicker = ref(false)
const showPayeePicker = ref(false)

watch(
  splits,
  (newSplits) => {
    splitsField.value = newSplits
  },
  { immediate: true },
)

// Prefill the form and the split composables once the expense's current data has loaded.
watch(
  expenseEditData,
  (data) => {
    if (!data) return
    title.value = data.title
    totalAmount.value = data.amount
    payerId.value = data.paidBy
    payeeIds.value = data.splits.map((s) => s.userId)
    splitMethod.value = data.splitMethod
    if (data.splitConfig.method === 'custom') {
      customAmountMap.value = data.splitConfig.amounts
    } else if (data.splitConfig.method === 'percentage') {
      percentageMap.value = data.splitConfig.percentages
    }
  },
  { immediate: true },
)

onMounted(() => {
  fetchMembers()
  fetchExpenseEditData()
})
</script>

<template>
  <div class="min-h-svh">
    <ExpenseCreateHeader title="Sửa khoản chi" :is-saving="isExpenseUpdating" @back="router.back()" @save="onSubmit" />

    <p v-if="isExpenseLoading" class="p-lg text-center text-sm text-text-muted">Đang tải...</p>

    <form v-else class="flex flex-col gap-8 p-sm" @submit.prevent="onSubmit">
      <div>
        <Label>Tổng số tiền</Label>
        <MoneyInput
          v-model="totalAmount"
          variant="filled"
          :locale="appSetting.locale"
          :currency="appSetting.currency"
          align="center"
          size="md"
        />
        <p v-if="errors.amount" class="mt-1 px-1 text-xs text-danger-main">{{ errors.amount }}</p>
      </div>
      <div>
        <Label>Tên khoản chi</Label>
        <Input v-model="title" size="sm" variant="filled" placeholder="Poisidon thượng hạn" />
        <p v-if="errors.title" class="mt-1 px-1 text-xs text-danger-main">{{ errors.title }}</p>
      </div>

      <PayerSelectRow :payer="payer" @click="showPayerPicker = true" />
      <PayeeSelectRow :members="payees" @click="showPayeePicker = true" />

      <div>
        <ExpenseSplitBreakdown
          :expense-participant="payees"
          :expense-participant-map="participantsMap"
          :total-amount="totalAmount"
          :splits="splits"
          :split-total="splitTotal"
          v-model:split-method="splitMethod"
          v-model:custom-amount-map="customAmountMap"
          v-model:percentage-map="percentageMap"
        />
        <p v-if="errors.splits" class="mt-1 px-1 text-xs text-error">{{ errors.splits }}</p>
      </div>
    </form>

    <PayerPickerModal
      :model-value="payerId"
      :open="showPayerPicker"
      :members="participants"
      @update:model-value="(selectedPayerId) => (payerId = selectedPayerId)"
      @close="showPayerPicker = false"
    />
    <PayeePickerModal
      v-model="payeeIds"
      :open="showPayeePicker"
      :members="participants"
      @close="showPayeePicker = false"
    />
  </div>
</template>
