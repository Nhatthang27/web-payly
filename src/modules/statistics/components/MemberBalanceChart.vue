<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, type ChartOptions } from 'chart.js'
import { useAppSettingStore } from '@/shared/stores/app-setting.store'
import { formatMoney, formatVNDtoK } from '@/shared/utils/money.util'
import type { GroupMemberBalance } from '@/modules/statistics/types/statistics.type'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{ balances: GroupMemberBalance[] }>()
const appSetting = useAppSettingStore()

const chartData = computed(() => ({
  labels: props.balances.map((b) => b.member.name),
  datasets: [
    {
      label: 'Bạn nợ',
      data: props.balances.map((b) => b.iOweThem),
      backgroundColor: '#f44336',
      borderRadius: 6,
      maxBarThickness: 20,
    },
    {
      label: 'Họ nợ bạn',
      data: props.balances.map((b) => b.theyOweMe),
      backgroundColor: '#4caf50',
      borderRadius: 6,
      maxBarThickness: 20,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12 } },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          `${ctx.dataset.label}: ${formatMoney(ctx.parsed.x ?? 0, appSetting.locale, appSetting.currency)}`,
      },
    },
  },
  scales: {
    x: { beginAtZero: true, ticks: { callback: (value) => formatVNDtoK(Number(value)) } },
    y: { grid: { display: false } },
  },
}))

const chartHeight = computed(() => Math.max(120, props.balances.length * 56 + 40))
</script>

<template>
  <div :style="{ height: `${chartHeight}px` }">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
