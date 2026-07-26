<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, useAttrs, type HTMLAttributes } from 'vue'
import { cn } from '@/shared/utils/cn.util'
import type {
  TypographyAs,
  TypographySize,
  TypographyWeight,
  TypographyColor,
  TypographyAlign,
} from './typography.type'

const props = withDefaults(
  defineProps<{
    as?: TypographyAs
    size?: TypographySize
    weight?: TypographyWeight
    color?: TypographyColor
    align?: TypographyAlign
    truncate?: boolean
    lineClamp?: 1 | 2 | 3
    /** Consumer classes (e.g. positioning/spacing) — merged in via cn(). */
    class?: HTMLAttributes['class']
  }>(),
  {
    as: 'span',
    size: 'sm',
    weight: 'regular',
    color: 'main',
    align: 'left',
    truncate: false,
  },
)

const attrs = useAttrs()

const sizeClasses = {
  xs: 'text-xs leading-normal',
  sm: 'text-sm leading-normal',
  md: 'text-md leading-normal',
  lg: 'text-lg leading-snug',
  xl: 'text-xl leading-snug',
  '2xl': 'text-2xl leading-tight',
  '3xl': 'text-3xl leading-tight',
} satisfies Record<TypographySize, string>

const weightClasses = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} satisfies Record<TypographyWeight, string>

const colorClasses = {
  main: 'text-text',
  muted: 'text-text-secondary',
  disabled: 'text-text-disabled',
  danger: 'text-error',
  success: 'text-success',
  inherit: 'text-inherit',
} satisfies Record<TypographyColor, string>

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} satisfies Record<TypographyAlign, string>

const lineClampClasses = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
} as const

const typographyClass = computed(() =>
  cn(
    sizeClasses[props.size],
    weightClasses[props.weight],
    colorClasses[props.color],
    alignClasses[props.align],
    props.truncate && 'truncate',
    props.lineClamp && lineClampClasses[props.lineClamp],
    props.class,
  ),
)
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<template>
  <component :is="as" v-bind="attrs" :class="typographyClass">
    <slot />
  </component>
</template>
