<script setup>
import { computed, onMounted } from 'vue'
import { format, isSameDay, subDays } from 'date-fns'
import { BarChart3 } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import CompletionChart from '@/components/dashboard/CompletionChart.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PRIORITIES, TASK_STATUSES, priorityMeta, statusMeta, projectStatusMeta, goalStatusMeta } from '@/lib/constants'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()

onMounted(() => {
  if (!store.loadedAt) store.load()
})

const priorityCounts = computed(() =>
  PRIORITIES.map((p) => ({
    key: p,
    label: priorityMeta[p].label,
    count: store.tasks.filter((t) => t.priority === p).length,
  })),
)
const priorityMax = computed(() => Math.max(1, ...priorityCounts.value.map((p) => p.count)))

const statusCounts = computed(() =>
  TASK_STATUSES.map((s) => ({
    key: s,
    label: statusMeta[s].label,
    variant: statusMeta[s].variant,
    count: store.tasks.filter((t) => t.status === s).length,
  })),
)

const trendChart = computed(() => {
  const labels = []
  const completed = []
  const created = []
  for (let i = 29; i >= 0; i--) {
    const day = subDays(new Date(), i)
    labels.push(format(day, 'MMM d'))
    completed.push(store.tasks.filter((t) => t.completedAt && isSameDay(new Date(t.completedAt), day)).length)
    created.push(store.tasks.filter((t) => t.createdAt && isSameDay(new Date(t.createdAt), day)).length)
  }
  return { labels, completed, created }
})

const categoryCounts = computed(() => {
  const counts = new Map()
  for (const t of store.tasks) {
    if (!t.categoryId) continue
    counts.set(t.categoryId, (counts.get(t.categoryId) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ name: store.categoryById[id]?.name || 'Unknown', color: store.categoryById[id]?.color, count }))
    .sort((a, b) => b.count - a.count)
})
const categoryMax = computed(() => Math.max(1, ...categoryCounts.value.map((c) => c.count)))
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Reports" description="Insights into your productivity and progress." />

    <LoadingState v-if="store.loading && !store.loadedAt" :rows="6" />
    <template v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total tasks" :value="store.totalTasks" :icon="BarChart3" tone="primary" hint="All time" />
        <StatCard title="Completed" :value="store.completedTasks.length" :icon="BarChart3" tone="success" hint="All time" />
        <StatCard title="Completion rate" :value="store.completionRate" :icon="BarChart3" tone="primary" hint="Completed vs total" />
        <StatCard title="Overdue" :value="store.overdue.length" :icon="BarChart3" tone="destructive" hint="Past due" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks created vs completed</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <CompletionChart :labels="trendChart.labels" :completed="trendChart.completed" :created="trendChart.created" />
        </CardContent>
      </Card>

      <div class="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by priority</CardTitle>
            <CardDescription>How your workload is weighted</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-for="row in priorityCounts" :key="row.key" class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span>{{ row.label }}</span>
                <span class="text-muted-foreground">{{ row.count }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-primary"
                  :style="{ width: `${(row.count / priorityMax) * 100}%` }"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by status</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="row in statusCounts"
              :key="row.key"
              class="flex items-center justify-between rounded-lg border p-3"
            >
              <Badge :variant="row.variant">{{ row.label }}</Badge>
              <span class="text-sm font-medium">{{ row.count }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by category</CardTitle>
            <CardDescription>Where your effort goes</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <p v-if="!categoryCounts.length" class="text-sm text-muted-foreground">No categorized tasks yet.</p>
            <div v-for="row in categoryCounts" :key="row.name" class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: row.color }" />
                  {{ row.name }}
                </span>
                <span class="text-muted-foreground">{{ row.count }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${(row.count / categoryMax) * 100}%`, backgroundColor: row.color }"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project progress</CardTitle>
            <CardDescription>Completion by project</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <p v-if="!store.projectProgress.length" class="text-sm text-muted-foreground">No projects yet.</p>
            <div v-for="p in store.projectProgress" :key="p.id" class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2">
                  {{ p.name }}
                  <Badge :variant="projectStatusMeta[p.status]?.variant || 'muted'">
                    {{ projectStatusMeta[p.status]?.label || p.status }}
                  </Badge>
                </span>
                <span class="text-muted-foreground">{{ p.done }}/{{ p.total }}</span>
              </div>
              <Progress :model-value="p.percent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goal progress</CardTitle>
          <CardDescription>Average {{ store.goalCompletion }}% across active goals</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <p v-if="!store.goals.length" class="text-sm text-muted-foreground">No goals yet.</p>
          <div v-for="goal in store.goals" :key="goal.id" class="space-y-1.5">
            <div class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2">
                {{ goal.title }}
                <Badge :variant="goalStatusMeta[goal.status]?.variant || 'muted'">
                  {{ goalStatusMeta[goal.status]?.label || goal.status }}
                </Badge>
              </span>
              <span class="text-muted-foreground">{{ goal.progress }}%</span>
            </div>
            <Progress :model-value="goal.progress" />
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
