<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
)

const props = defineProps({
  labels: { type: Array, default: () => [] },
  completed: { type: Array, default: () => [] },
  created: { type: Array, default: () => [] },
})

const { isDark } = useTheme()

const gridColor = computed(() => (isDark.value ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'))
const tickColor = computed(() => (isDark.value ? '#94a3b8' : '#64748b'))

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Completed',
      data: props.completed,
      backgroundColor: 'rgba(13,148,136,0.85)',
      hoverBackgroundColor: 'rgba(13,148,136,1)',
      borderRadius: 6,
      maxBarThickness: 28,
    },
    {
      label: 'Created',
      data: props.created,
      backgroundColor: isDark.value ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.45)',
      hoverBackgroundColor: isDark.value ? 'rgba(148,163,184,0.55)' : 'rgba(100,116,139,0.6)',
      borderRadius: 6,
      maxBarThickness: 28,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        color: tickColor.value,
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        padding: 16,
        font: { size: 12 },
      },
    },
    tooltip: {
      backgroundColor: isDark.value ? '#0f172a' : '#0f172a',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: tickColor.value, font: { size: 11 } },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      precision: 0,
      grid: { color: gridColor.value },
      ticks: { color: tickColor.value, font: { size: 11 } },
      border: { display: false },
    },
  },
}))
</script>

<template>
  <div class="h-[280px]">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
