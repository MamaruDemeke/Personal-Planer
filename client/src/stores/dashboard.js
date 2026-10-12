import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  endOfDay,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  startOfDay,
  subDays,
} from 'date-fns'

import { percentage } from '@/lib/utils'
import { computePlanProgress, summarizePlans } from '@/lib/planProgress'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useGoalsStore } from '@/stores/goals'
import { useEventsStore } from '@/stores/events'
import { useCategoriesStore } from '@/stores/categories'
import { usePlansStore } from '@/stores/plans'

/**
 * Aggregates the per-resource stores into the metrics the dashboard renders.
 * Every number is DERIVED from live records — nothing is hardcoded, and edits
 * made in any module are reflected here immediately.
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const tasksStore = useTasksStore()
  const projectsStore = useProjectsStore()
  const goalsStore = useGoalsStore()
  const eventsStore = useEventsStore()
  const categoriesStore = useCategoriesStore()
  const plansStore = usePlansStore()

  const tasks = computed(() => tasksStore.items)
  const projects = computed(() => projectsStore.items)
  const goals = computed(() => goalsStore.items)
  const events = computed(() => eventsStore.items)
  const categories = computed(() => categoriesStore.items)
  const plans = computed(() => plansStore.items)

  const loading = computed(
    () =>
      tasksStore.loading ||
      projectsStore.loading ||
      goalsStore.loading ||
      eventsStore.loading ||
      categoriesStore.loading ||
      plansStore.loading,
  )
  // Plans are an optional module: a not-yet-migrated `plans` table must never
  // fail the whole dashboard, so its error is intentionally excluded here.
  const error = computed(
    () =>
      tasksStore.error ||
      projectsStore.error ||
      goalsStore.error ||
      eventsStore.error ||
      categoriesStore.error,
  )
  const loadedAt = ref(null)

  async function load() {
    await Promise.all([
      tasksStore.load(),
      projectsStore.load(),
      goalsStore.load(),
      eventsStore.load(),
      categoriesStore.load(),
      plansStore.load(),
    ])
    loadedAt.value = new Date().toISOString()
  }

  const totalTasks = computed(() => tasks.value.length)
  const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'completed'))
  const completedToday = computed(
    () =>
      tasks.value.filter(
        (t) => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt)),
      ).length,
  )
  const inProgress = computed(() => tasks.value.filter((t) => t.status === 'in_progress').length)
  const overdue = computed(() =>
    tasks.value.filter(
      (t) =>
        t.status !== 'completed' && t.dueDate && isBefore(new Date(t.dueDate), startOfDay(new Date())),
    ),
  )

  const upcomingTasks = computed(() => {
    const start = startOfDay(new Date())
    const end = endOfDay(subDays(new Date(), -7))
    return tasks.value
      .filter((t) => {
        if (t.status === 'completed' || !t.dueDate) return false
        const due = new Date(t.dueDate)
        return !isBefore(due, start) && !isAfter(due, end)
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  })

  const activeProjects = computed(() => projects.value.filter((p) => p.status === 'active'))
  const activeGoals = computed(() => goals.value.filter((g) => g.status === 'active'))

  const goalCompletion = computed(() => {
    const list = activeGoals.value
    if (!list.length) return 0
    const total = list.reduce((sum, g) => sum + (Number(g.progress) || 0), 0)
    return Math.round(total / list.length)
  })

  const completionRate = computed(() => percentage(completedTasks.value.length, totalTasks.value))

  const todaysEvents = computed(() =>
    [...events.value]
      .filter((e) => isSameDay(new Date(e.startTime), new Date()))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
  )

  const categoryById = computed(() => {
    const map = {}
    for (const c of categories.value) map[c.id] = c
    return map
  })

  const projectById = computed(() => {
    const map = {}
    for (const p of projects.value) map[p.id] = p
    return map
  })

  /** Recent activity derived from real task records — nothing hardcoded. */
  const recentActivities = computed(() => {
    const feed = []
    for (const task of tasks.value) {
      if (task.completedAt) {
        feed.push({
          id: `completed-${task.id}`,
          type: 'task_completed',
          label: `Completed "${task.title}"`,
          at: task.completedAt,
        })
      } else if (task.createdAt) {
        feed.push({
          id: `created-${task.id}`,
          type: 'task_created',
          label: `Created "${task.title}"`,
          at: task.createdAt,
        })
      }
    }
    for (const plan of plans.value) {
      if (plan.completedAt) {
        feed.push({
          id: `plan-completed-${plan.id}`,
          type: 'plan_completed',
          label: `Completed plan "${plan.title}"`,
          at: plan.completedAt,
        })
      } else if (plan.createdAt) {
        feed.push({
          id: `plan-created-${plan.id}`,
          type: 'plan_created',
          label: `Created plan "${plan.title}"`,
          at: plan.createdAt,
        })
      }
    }
    return feed.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6)
  })

  /** Project progress: share of completed tasks per project. */
  const projectProgress = computed(() =>
    projects.value.map((p) => {
      const projectTasks = tasks.value.filter((t) => t.projectId === p.id)
      const done = projectTasks.filter((t) => t.status === 'completed').length
      return {
        ...p,
        total: projectTasks.length,
        done,
        percent: percentage(done, projectTasks.length),
      }
    }),
  )

  /** Plans paired with derived progress, using the same helper as the Plans view. */
  const planProgressList = computed(() =>
    plans.value.map((plan) => ({ plan, progress: computePlanProgress(plan, tasks.value) })),
  )

  const activePlans = computed(() =>
    planProgressList.value.filter((r) => !r.progress.isCompleted && !r.progress.isArchived),
  )
  const completedPlans = computed(() => planProgressList.value.filter((r) => r.progress.isCompleted))
  const overduePlans = computed(() => planProgressList.value.filter((r) => r.progress.isOverdue))
  const planSummary = computed(() => summarizePlans(plans.value, tasks.value))

  return {
    tasks,
    projects,
    goals,
    events,
    categories,
    plans,
    loading,
    error,
    loadedAt,
    load,
    totalTasks,
    completedTasks,
    completedToday,
    inProgress,
    overdue,
    upcomingTasks,
    activeProjects,
    activeGoals,
    goalCompletion,
    completionRate,
    todaysEvents,
    categoryById,
    projectById,
    recentActivities,
    projectProgress,
    planProgressList,
    activePlans,
    completedPlans,
    overduePlans,
    planSummary,
  }
})
