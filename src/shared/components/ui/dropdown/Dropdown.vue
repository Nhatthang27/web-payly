<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { cn } from '@/shared/utils/cn.util'
import type { DropdownProps, DropdownSize } from './dropdown.type'

const props = withDefaults(defineProps<DropdownProps>(), {
  placement: 'bottom-start',
  size: 'md',
  disabled: false,
})

const open = defineModel<boolean>('open', { default: false })
const selectedKey = defineModel<string | undefined>('selectedKey')

const emit = defineEmits<{ select: [key: string] }>()

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function close() {
  open.value = false
}

function select(option: DropdownProps['options'][number]) {
  if (option.disabled) return
  selectedKey.value = option.key
  emit('select', option.key)
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const panelClass = computed(() =>
  cn(
    'absolute z-50 flex min-w-[10rem] flex-col gap-3 rounded-md border border-border-secondary bg-bg-elevated p-sm shadow-md',
    props.placement === 'bottom-start' && 'top-full left-0 mt-1',
    props.placement === 'bottom-end' && 'top-full right-0 mt-1',
    props.placement === 'top-start' && 'bottom-full left-0 mb-1',
    props.placement === 'top-end' && 'bottom-full right-0 mb-1',
    props.class,
  ),
)

const itemSizeClasses: Record<DropdownSize, string> = {
  xs: 'gap-1 px-3 py-1 text-xs',
  sm: 'gap-1.5 px-4 py-2 text-sm',
  md: 'gap-2 px-5 py-2 text-md',
  lg: 'gap-2.5 px-8 py-3 text-lg',
  xl: 'gap-3 px-10 py-4 text-xl',
}

const iconSizeMap: Record<DropdownSize, number> = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 28,
}

const itemClass = computed(() =>
  cn(
    'flex w-full items-center rounded-sm text-left text-text-secondary disabled:cursor-not-allowed disabled:opacity-50',
    itemSizeClasses[props.size],
  ),
)
</script>

<template>
  <div class="relative inline-block">
    <div :aria-expanded="open" aria-haspopup="listbox" @click="toggle">
      <slot name="trigger" :open="open" />
    </div>

    <div v-if="open" class="fixed inset-0 z-40" @click="close" />

    <div v-if="open" role="listbox" :class="panelClass">
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        role="option"
        :aria-selected="option.key === selectedKey"
        :disabled="option.disabled"
        :class="[itemClass, option.key === selectedKey ? 'bg-bg-active font-semibold text-text' : 'hover:bg-bg-active']"
        @click="select(option)"
      >
        <component
          :is="option.icon"
          v-if="option.icon"
          :size="iconSizeMap[size]"
          :stroke-width="option.key === selectedKey ? 2 : 1"
        />
        <span class="truncate leading-none">{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
