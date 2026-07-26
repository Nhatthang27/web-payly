<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Upload } from '@/shared/components/ui/upload'
import type { UploadFn, UploadItem } from '@/shared/components/ui/upload'
import { expenseApi } from '@/modules/expense/api/expense.api'
import { useAuthStore } from '@/shared/stores/auth.store'

const paths = defineModel<string[]>('paths', { default: () => [] })

const auth = useAuthStore()

const uploadFn: UploadFn = (file) => {
  const userId = auth.profile?.id
  if (!userId) return Promise.reject(new Error('Bạn cần đăng nhập để tải lên hóa đơn'))
  return expenseApi.uploadExpenseEvidence(userId, file)
}

function handleUploadError(item: UploadItem) {
  toast.error('Tải ảnh lên thất bại', { description: item.error })
}
</script>

<template>
  <Upload v-model:paths="paths" :upload-fn="uploadFn" :max-files="1" :max-size-m-b="5" @error="handleUploadError" />
</template>
