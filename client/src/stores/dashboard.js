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

import { activities } from '@/services/seed'
import { percentage } from '@/lib/utils'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useGoalsStore } from '@/stores/goals'
import { useEventsStore } from '@/stores/events'
import { useCategoriesStore } from '@/stores/categories'

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

  const tasks = computed(() => tasksStore.items)
  const projects = computed(() => projectsStore.items)
  const goals = computed(() => goalsStore.items)
  const events = computed(() => eventsStore.items)
  const categories = computed(() => categoriesStore.items)

  const loading = computed(
    () =>
      tasksStore.loading ||
      projectsStore.loading ||
      goalsStore.loading ||
      eventsStore.loading ||
      categoriesStore.loading,
  )
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

  const recentActivities = computed(() =>
    [...activities].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6),
  )

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

  return {
    tasks,
    projects,
    goals,
    events,
    categories,
    activities: ref(activities),
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
  }
})
