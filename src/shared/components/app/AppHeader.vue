<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/shared/utils/cn.util'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <header :class="cn('sticky top-0 z-50 bg-bg-layout border-b border-border shadow-sm px-sm', props.class)">
    <div
      :class="{
        'grid h-24 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center': !!$slots.center,
        'flex h-24 items-center justify-between': !$slots.center && !!$slots.right,
        'flex h-24 items-center': !$slots.center && !$slots.right,
      }"
    >
      <div class="flex min-w-0 items-center justify-start">
        <slot name="left" />
      </div>

      <div v-if="$slots.center" class="flex items-center justify-center">
        <slot name="center" />
      </div>

      <div v-if="$slots.right" class="flex min-w-0 items-center justify-end">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>
