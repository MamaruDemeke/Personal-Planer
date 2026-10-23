<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import EmptyState from '@/components/common/EmptyState.vue'
import { BarChart3 } from 'lucide-vue-next'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  byPriority: { type: Object, default: () => ({}) },
})

const data = computed(() => ({
  labels: ['Low', 'Medium', 'High'],
  datasets: [
    {
      label: 'Tasks',
      data: [props.byPriority.low ?? 0, props.byPriority.medium ?? 0, props.byPriority.high ?? 0],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      borderRadius: 6,
      maxBarThickness: 56,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { precision: 0, font: { size: 10 } },
      grid: { color: 'rgba(148,163,184,0.2)' },
    },
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

const isEmpty = computed(() =>
  ['low', 'medium', 'high'].every((k) => !props.byPriority[k]),
)
</script>

<template>
  <div class="h-44">
    <EmptyState
      v-if="isEmpty"
      title="No tasks yet"
      description="Add tasks to see the priority breakdown."
      class="h-full py-0"
    >
      <template #icon><BarChart3 class="h-5 w-5" /></template>
    </EmptyState>
    <Bar v-else :data="data" :options="options" />
  </div>
</template>
