<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import EmptyState from '@/components/common/EmptyState.vue'
import { BarChart3 } from 'lucide-vue-next'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  byStatus: { type: Object, default: () => ({}) },
})

const labels = ['Not started', 'In progress', 'Completed']
const colors = ['#94a3b8', '#3b82f6', '#22c55e']

const data = computed(() => ({
  labels,
  datasets: [
    {
      data: [
        props.byStatus.not_started ?? 0,
        props.byStatus.in_progress ?? 0,
        props.byStatus.completed ?? 0,
      ],
      backgroundColor: colors,
      borderWidth: 0,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 9,
        boxHeight: 9,
        padding: 8,
        usePointStyle: true,
        font: { size: 10 },
      },
    },
  },
}

const isEmpty = computed(() =>
  ['not_started', 'in_progress', 'completed'].every((k) => !props.byStatus[k]),
)
</script>

<template>
  <div class="h-44">
    <EmptyState
      v-if="isEmpty"
      title="No tasks yet"
      description="Add tasks to see the status breakdown."
      class="h-full py-0"
    >
      <template #icon><BarChart3 class="h-5 w-5" /></template>
    </EmptyState>
    <Doughnut v-else :data="data" :options="options" />
  </div>
</template>
