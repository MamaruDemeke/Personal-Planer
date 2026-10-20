<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
  ListTodo,
  Loader2,
  Lock,
  Plus,
  Receipt,
  ShieldAlert,
  Target,
  TrendingUp,
} from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import TaskStatusChart from '@/components/dashboard/TaskStatusChart.vue'
import TaskPriorityChart from '@/components/dashboard/TaskPriorityChart.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAccessStore } from '@/stores/access'
import { useDashboardStore } from '@/stores/dashboard'

const router = useRouter()
const access = useAccessStore()
const dashboard = useDashboardStore()

const locked = computed(() => access.isLocked)

onMounted(() => {
  dashboard.load().catch(() => {})
})

const s = computed(() => dashboard.summary)
const loading = computed(() => dashboard.loading && !dashboard.loaded)

const lockInfo = computed(() => {
  switch (access.reason) {
    case 'pending':
      return { title: 'Payment under review', message: 'Receipt being verified.', icon: Clock }
    case 'rejected':
      return { title: 'Payment rejected', message: access.summary?.paymentReviewNote || 'Submit a new receipt.', icon: ShieldAlert }
    case 'expired':
      return { title: 'Access expired', message: 'Submit a new payment.', icon: AlertTriangle }
    case 'revoked':
      return { title: 'Access revoked', message: access.summary?.paymentReviewNote || 'Contact administrator.', icon: ShieldAlert }
    default:
      return { title: 'Unlock the planner', message: 'Submit payment to unlock.', icon: Lock }
  }
})

function newTask() {
  router.push({ name: 'tasks', query: { new: '1' } })
}
function goToPayment() {
  router.push({ name: 'access' })
}
</script>

<template>
  <div class="space-y-3">
    <PageHeader title="Dashboard" description="Your work at a glance.">
      <template #actions>
        <Button v-if="!locked" size="sm" @click="newTask">
          <Plus class="h-4 w-4" /> New task
        </Button>
      </template>
    </PageHeader>

    <Card v-if="locked" class="border-warning/40 bg-warning/5">
      <CardContent class="flex items-center justify-between gap-3 py-3">
        <div class="flex items-center gap-2">
          <component :is="lockInfo.icon" class="h-4 w-4 text-warning" />
          <span class="text-sm font-medium">{{ lockInfo.title }}</span>
          <span class="text-xs text-muted-foreground">{{ lockInfo.message }}</span>
        </div>
        <Button size="sm" @click="goToPayment">
          <Receipt class="h-4 w-4" /> Pay
        </Button>
      </CardContent>
    </Card>

    <LoadingState v-if="loading" :rows="2" />

    <ErrorState
      v-else-if="dashboard.error && !s"
      title="Could not load dashboard"
      :description="dashboard.error"
      @retry="dashboard.load({ force: true })"
    />

    <template v-else-if="s">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total" :value="s.total" tone="info" :icon="ListTodo" :hint="`${s.notStarted} todo`" />
        <StatCard label="Completed" :value="s.completed" tone="success" :icon="CheckCircle2" :hint="`${s.completionRate}%`" />
        <StatCard label="Pending" :value="s.pending" tone="warning" :icon="Clock" :hint="`${s.inProgress} active`" />
        <StatCard label="Overdue" :value="s.overdue" tone="destructive" :icon="AlertTriangle" :hint="s.overdue ? 'attention' : 'none'" />
        <StatCard label="Progress" :value="`${s.completionRate}%`" :progress="s.completionRate" tone="primary" :icon="TrendingUp" :hint="`${s.completed}/${s.total}`" />
      </div>

      <!-- Overall progress -->
      <Card>
        <CardContent class="flex items-center gap-3 py-3">
          <Target class="h-5 w-5 shrink-0 text-primary" />
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex items-center justify-between text-xs">
              <span class="font-medium">Overall completion</span>
              <span class="text-muted-foreground">avg {{ s.avgProgress }}%</span>
            </div>
            <Progress :model-value="s.completionRate" class="h-2" :indicator-style="{ backgroundColor: '#0d9488' }" />
          </div>
          <span class="text-lg font-bold tabular-nums text-primary">{{ s.completionRate }}%</span>
        </CardContent>
      </Card>

      <!-- Charts -->
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Card>
          <CardHeader class="p-3 pb-1">
            <CardTitle class="flex items-center gap-1.5 text-sm">
              <ListChecks class="h-3.5 w-3.5 text-info" /> By status
            </CardTitle>
          </CardHeader>
          <CardContent class="p-3 pt-0">
            <TaskStatusChart :by-status="s.byStatus" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="p-3 pb-1">
            <CardTitle class="flex items-center gap-1.5 text-sm">
              <Flame class="h-3.5 w-3.5 text-warning" /> By priority
            </CardTitle>
          </CardHeader>
          <CardContent class="p-3 pt-0">
            <TaskPriorityChart :by-priority="s.byPriority" />
          </CardContent>
        </Card>
      </div>

      <!-- Lists -->
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Card>
          <CardHeader class="p-3 pb-1">
            <CardTitle class="flex items-center gap-1.5 text-sm">
              <TrendingUp class="h-3.5 w-3.5 text-primary" /> Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-1 p-3 pt-0">
            <div v-if="!(s.upcoming?.length)" class="py-3 text-center text-xs text-muted-foreground">Nothing due soon.</div>
            <div
              v-for="t in (s.upcoming ?? []).slice(0, 4)"
              :key="t.id"
              class="flex items-center justify-between rounded border px-2 py-1 text-xs"
            >
              <span class="truncate font-medium">{{ t.title }}</span>
              <span class="shrink-0 text-muted-foreground">{{ new Date(t.deadline).toLocaleDateString() }}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="p-3 pb-1">
            <CardTitle class="flex items-center gap-1.5 text-sm">
              <AlertTriangle class="h-3.5 w-3.5 text-destructive" /> Overdue
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-1 p-3 pt-0">
            <div v-if="!(s.overdueTasks?.length)" class="py-3 text-center text-xs text-muted-foreground">No overdue tasks.</div>
            <div
              v-for="t in (s.overdueTasks ?? []).slice(0, 4)"
              :key="t.id"
              class="flex items-center justify-between rounded border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs"
            >
              <span class="truncate font-medium">{{ t.title }}</span>
              <span class="shrink-0 text-destructive">{{ new Date(t.deadline).toLocaleDateString() }}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>

    <div v-else-if="dashboard.loading" class="flex items-center justify-center py-8 text-muted-foreground">
      <Loader2 class="h-5 w-5 animate-spin" />
    </div>
  </div>
</template>
