<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { format } from 'date-fns'
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Loader2,
  Timer,
  TrendingUp,
} from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import TaskPriorityBadge from '@/components/tasks/TaskPriorityBadge.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProgressStore } from '@/stores/progress'
import { formatDate, formatDateTime, formatDuration } from '@/lib/format'

const progress = useProgressStore()
const period = ref('daily')

onMounted(() => {
  progress.load(period.value).catch(() => {})
})

watch(period, (value) => {
  progress.load(value).catch(() => {})
})

const d = computed(() => progress.data)
const loading = computed(() => progress.loading && !d.value)

const bucketMax = computed(() => {
  const list = d.value?.buckets ?? []
  return Math.max(1, ...list.map((b) => b.completed + b.delayed))
})

function bucketLabel(key) {
  return format(new Date(`${key}T00:00:00`), period.value === 'weekly' ? 'MMM d' : 'MMM d')
}

function bucketWidth(value) {
  return `${Math.round((value / bucketMax.value) * 100)}%`
}

function lateLabel(row) {
  if (row.onTime == null) return { text: 'No deadline', variant: 'muted' }
  if (row.onTime) return { text: 'On time', variant: 'success' }
  return { text: `Late · ${formatDuration(Math.abs(row.latenessMs))}`, variant: 'destructive' }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <PageHeader
      title="Progress & Reports"
      description="Completion percentages, real completion times, delayed tasks and daily or weekly reports."
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <Button
            :variant="period === 'daily' ? 'default' : 'outline'"
            size="sm"
            @click="period = 'daily'"
          >
            Daily
          </Button>
          <Button
            :variant="period === 'weekly' ? 'default' : 'outline'"
            size="sm"
            @click="period = 'weekly'"
          >
            Weekly
          </Button>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="loading" :rows="5" />

    <ErrorState
      v-else-if="progress.error && !d"
      title="Could not load progress"
      :description="progress.error"
      @retry="progress.load(period, { force: true })"
    />

    <template v-else-if="d">
      <!-- Summary tiles -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completion"
          :value="`${d.completionRate}%`"
          :progress="d.completionRate"
          tone="primary"
          :icon="Gauge"
          :hint="`${d.completed}/${d.total}`"
        />
        <StatCard
          label="On-time rate"
          :value="d.onTimeRate == null ? '—' : `${d.onTimeRate}%`"
          tone="success"
          :icon="CheckCircle2"
          hint="finished before deadline"
        />
        <StatCard
          label="Avg completion time"
          :value="formatDuration(d.avgCompletionMs)"
          tone="info"
          :icon="Timer"
          hint="start to finish"
        />
        <StatCard
          label="Delayed tasks"
          :value="d.delayedCount"
          tone="destructive"
          :icon="AlertTriangle"
          :hint="d.delayedCount ? 'need attention' : 'none'"
        />
      </div>

      <!-- Period rollup + category completion -->
      <div class="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0">
            <CardTitle class="flex items-center gap-2 text-base">
              <TrendingUp class="h-4 w-4 text-primary" />
              {{ period === 'weekly' ? 'Weekly' : 'Daily' }} activity
            </CardTitle>
            <div class="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-full" style="background-color: #22c55e" />
                Completed
              </span>
              <span class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-full" style="background-color: #ef4444" />
                Delayed
              </span>
            </div>
          </CardHeader>
          <CardContent class="space-y-2.5 pt-0">
            <div v-for="bucket in d.buckets" :key="bucket.key" class="flex items-center gap-3">
              <span class="w-14 shrink-0 text-xs text-muted-foreground">
                {{ bucketLabel(bucket.key) }}
              </span>
              <div class="flex h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  style="background-color: #22c55e"
                  :style="{ width: bucketWidth(bucket.completed) }"
                />
                <span
                  style="background-color: #ef4444"
                  :style="{ width: bucketWidth(bucket.delayed) }"
                />
              </div>
              <span class="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {{ bucket.completed }} done
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">Completion by category</CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <EmptyState
              v-if="!d.byCategory.length"
              title="No categorised tasks"
              description="Add categories to a task to compare completion here."
              class="py-8"
            >
              <template #icon><CheckCircle2 class="h-5 w-5" /></template>
            </EmptyState>
            <ul v-else class="space-y-3">
              <li v-for="cat in d.byCategory" :key="cat.id ?? 'none'" class="space-y-1.5">
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="flex min-w-0 items-center gap-2">
                    <span
                      class="h-2.5 w-2.5 shrink-0 rounded-full"
                      :style="{ backgroundColor: cat.color }"
                    />
                    <span class="truncate font-medium">{{ cat.name }}</span>
                  </span>
                  <span class="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {{ cat.completed }}/{{ cat.total }} · {{ cat.rate }}%
                  </span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <span
                    class="block h-full rounded-full"
                    :style="{ width: `${cat.rate}%`, backgroundColor: cat.color }"
                  />
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <!-- Actual completion times + delayed tasks -->
      <div class="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0">
            <CardTitle class="flex items-center gap-2 text-base">
              <Timer class="h-4 w-4 text-info" />
              Actual completion times
            </CardTitle>
            <Badge variant="info">{{ d.completionTimes.length }}</Badge>
          </CardHeader>
          <CardContent class="pt-0">
            <EmptyState
              v-if="!d.completionTimes.length"
              title="Nothing completed yet"
              description="Completed tasks will show their real duration here."
              class="py-8"
            >
              <template #icon><Timer class="h-5 w-5" /></template>
            </EmptyState>
            <ul v-else class="divide-y">
              <li
                v-for="row in d.completionTimes.slice(0, 10)"
                :key="row.id"
                class="flex items-center gap-3 py-2.5"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ row.title }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatDateTime(row.completedAt) }} · took {{ formatDuration(row.durationMs) }}
                  </p>
                </div>
                <TaskPriorityBadge :priority="row.priority" />
                <Badge :variant="lateLabel(row).variant">{{ lateLabel(row).text }}</Badge>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0">
            <CardTitle class="flex items-center gap-2 text-base">
              <AlertTriangle class="h-4 w-4 text-destructive" />
              Delayed tasks
            </CardTitle>
            <Badge v-if="d.delayedCount" variant="destructive">{{ d.delayedCount }}</Badge>
          </CardHeader>
          <CardContent class="pt-0">
            <EmptyState
              v-if="!d.delayedTasks.length"
              title="No delayed tasks"
              description="Task finished on time stay out of this list."
              class="py-8"
            >
              <template #icon><CheckCircle2 class="h-5 w-5" /></template>
            </EmptyState>
            <ul v-else class="divide-y">
              <li
                v-for="task in d.delayedTasks.slice(0, 10)"
                :key="task.id"
                class="flex items-center gap-3 py-2.5"
              >
                <span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background-color: #ef4444" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ task.title }}</p>
                  <p class="text-xs text-destructive">
                    {{ task.overdue ? 'Overdue since' : 'Completed late' }}
                    {{ formatDate(task.deadline) }}
                  </p>
                </div>
                <TaskPriorityBadge :priority="task.priority" />
                <Badge :variant="task.overdue ? 'destructive' : 'warning'">
                  {{ task.overdue ? 'Overdue' : 'Late' }}
                </Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </template>

    <div
      v-else-if="progress.loading"
      class="flex items-center justify-center py-16 text-muted-foreground"
    >
      <Loader2 class="h-5 w-5 animate-spin" />
    </div>
  </div>
</template>
