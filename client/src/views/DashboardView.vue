<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
  Loader2,
  Plus,
  TrendingUp,
} from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import MiniBreakdown from '@/components/dashboard/MiniBreakdown.vue'
import { Button } from '@/components/ui/button'
import { useDashboardStore } from '@/stores/dashboard'

const router = useRouter()
const dashboard = useDashboardStore()

onMounted(() => {
  dashboard.load().catch(() => {})
})

const s = computed(() => dashboard.summary)
const loading = computed(() => dashboard.loading && !dashboard.loaded)

const statusSegments = computed(() => [
  { label: 'Not started', value: s.value?.byStatus?.not_started ?? 0, color: '#94a3b8' },
  { label: 'In progress', value: s.value?.byStatus?.in_progress ?? 0, color: '#3b82f6' },
  { label: 'Completed', value: s.value?.byStatus?.completed ?? 0, color: '#22c55e' },
])

const prioritySegments = computed(() => [
  { label: 'Low', value: s.value?.byPriority?.low ?? 0, color: '#22c55e' },
  { label: 'Medium', value: s.value?.byPriority?.medium ?? 0, color: '#f59e0b' },
  { label: 'High', value: s.value?.byPriority?.high ?? 0, color: '#ef4444' },
])

function newTask() {
  router.push({ name: 'tasks', query: { new: '1' } })
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <PageHeader title="Dashboard" description="Today at a glance — what's done, pending and overdue.">
      <template #actions>
        <Button @click="newTask">
          <Plus class="h-4 w-4" />
          New task
        </Button>
      </template>
    </PageHeader>

    <LoadingState v-if="loading" :rows="4" />

    <ErrorState
      v-else-if="dashboard.error && !s"
      title="Could not load dashboard"
      :description="dashboard.error"
      @retry="dashboard.load({ force: true })"
    />

    <template v-else-if="s">
      <!-- Compact summary tiles (horizontal rectangles) -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          label="Today's tasks"
          :value="s.todayTasks?.length ?? 0"
          tone="info"
          :icon="CalendarDays"
          :hint="`${s.todayTasks?.filter((t) => t.isCompleted).length ?? 0} done`"
        />
        <StatCard
          label="Completed"
          :value="s.completed"
          tone="success"
          :icon="CheckCircle2"
          :hint="`of ${s.total}`"
        />
        <StatCard label="Pending" :value="s.pending" tone="warning" :icon="Clock" :hint="`${s.inProgress} active`" />
        <StatCard
          label="Overdue"
          :value="s.overdue"
          tone="destructive"
          :icon="AlertTriangle"
          :hint="s.overdue ? 'attention' : 'none'"
        />
        <StatCard
          label="Upcoming"
          :value="s.upcoming?.length ?? 0"
          tone="purple"
          :icon="CalendarClock"
          hint="next 7 days"
        />
        <StatCard
          label="Overall progress"
          :value="`${s.completionRate}%`"
          :progress="s.completionRate"
          tone="primary"
          :icon="TrendingUp"
          :hint="`${s.completed}/${s.total}`"
        />
      </div>

      <!-- Compact breakdowns (horizontal rectangles) -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniBreakdown
          label="Tasks by status"
          tone="info"
          :icon="ListChecks"
          :segments="statusSegments"
        />
        <MiniBreakdown
          label="Tasks by priority"
          tone="warning"
          :icon="Flame"
          :segments="prioritySegments"
        />
      </div>
    </template>

    <div
      v-else-if="dashboard.loading"
      class="flex items-center justify-center py-16 text-muted-foreground"
    >
      <Loader2 class="h-5 w-5 animate-spin" />
    </div>
  </div>
</template>
