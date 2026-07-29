<script setup lang="ts">
import { cn } from '@/shared/utils/cn.util'

defineProps<{
  label: string
  value: string
  isError: boolean
}>()
</script>

<template>
  <div class="flex items-center justify-between mt-4 pl-4 pr-7 text-xs">
    <span class="text-text-muted">{{ label }}</span>
    <span :class="cn('font-semibold text-sm', isError ? 'text-error' : 'text-success')">{{ value }}</span>
  </div>
</template>
