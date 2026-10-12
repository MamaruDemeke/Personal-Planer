<script setup>
import { computed, onMounted } from 'vue'
import { format, isSameDay, subDays } from 'date-fns'
import { BarChart3 } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import CompletionChart from '@/components/dashboard/CompletionChart.vue'
import PlanProgressBar from '@/components/plans/PlanProgressBar.vue'
import PlanStatusBadge from '@/components/plans/PlanStatusBadge.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  PLAN_PERIODS,
  PRIORITIES,
  TASK_STATUSES,
  planPeriodMeta,
  priorityMeta,
  statusMeta,
  projectStatusMeta,
  goalStatusMeta,
} from '@/lib/constants'
import { derivedPlanStatus } from '@/lib/planProgress'
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

const periodCounts = computed(() =>
  PLAN_PERIODS.map((p) => ({
    key: p,
    label: planPeriodMeta[p].label,
    accent: planPeriodMeta[p].accent,
    count: store.plans.filter((plan) => plan.period === p).length,
  })),
)
const periodMax = computed(() => Math.max(1, ...periodCounts.value.map((p) => p.count)))
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader title="Reports" description="Insights into your productivity and progress." />

    <LoadingState v-if="store.loading && !store.loadedAt" :rows="6" />
    <template v-else>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total tasks" :value="store.totalTasks" :icon="BarChart3" tone="primary" hint="All time" />
        <StatCard title="Completed" :value="store.completedTasks.length" :icon="BarChart3" tone="success" hint="All time" />
        <StatCard title="Completion rate" :value="store.completionRate" :icon="BarChart3" tone="primary" hint="Completed vs total" />
        <StatCard title="Overdue" :value="store.overdue.length" :icon="BarChart3" tone="destructive" hint="Past due" />
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Plans" :value="store.planSummary.total" :icon="BarChart3" tone="info" hint="All periods" />
        <StatCard title="Active plans" :value="store.planSummary.active" :icon="BarChart3" tone="primary" :hint="`${store.planSummary.avgProgress}% avg progress`" />
        <StatCard title="Completed plans" :value="store.planSummary.completed" :icon="BarChart3" tone="success" hint="Finished" />
        <StatCard title="Overdue plans" :value="store.planSummary.overdue" :icon="BarChart3" tone="destructive" hint="Past deadline" />
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

      <div class="grid gap-3 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by priority</CardTitle>
            <CardDescription>How your workload is weighted</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
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
              class="flex items-center justify-between rounded-lg border p-2.5"
            >
              <Badge :variant="row.variant">{{ row.label }}</Badge>
              <span class="text-sm font-medium">{{ row.count }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-3 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by category</CardTitle>
            <CardDescription>Where your effort goes</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
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
          <CardContent class="space-y-3">
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
        <CardContent class="space-y-3">
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

      <div class="grid gap-3 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plans by period</CardTitle>
            <CardDescription>Daily vs weekly vs monthly vs yearly</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-for="row in periodCounts" :key="row.key" class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span>{{ row.label }}</span>
                <span class="text-muted-foreground">{{ row.count }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${(row.count / periodMax) * 100}%`, backgroundColor: row.accent }"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan progress</CardTitle>
            <CardDescription>Completion tracked from linked tasks</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <p v-if="!store.planProgressList.length" class="text-sm text-muted-foreground">No plans yet.</p>
            <div
              v-for="row in store.planProgressList"
              :key="row.plan.id"
              class="space-y-1.5 rounded-lg border p-2.5"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span class="flex items-center gap-2">
                  {{ row.plan.title }}
                  <Badge :variant="planPeriodMeta[row.plan.period]?.variant || 'muted'">
                    {{ planPeriodMeta[row.plan.period]?.label || row.plan.period }}
                  </Badge>
                  <PlanStatusBadge :status="derivedPlanStatus(row.plan, row.progress)" />
                </span>
                <span class="text-muted-foreground">{{ row.progress.completed }}/{{ row.progress.total }}</span>
              </div>
              <PlanProgressBar
                :progress="row.progress"
                :plan="row.plan"
                :accent="planPeriodMeta[row.plan.period]?.accent || 'var(--color-primary)'"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
