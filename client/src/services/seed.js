import {
  addDays,
  subDays,
  startOfDay,
  setHours,
  setMinutes,
} from 'date-fns'

/**
 * TEMPORARY in-memory seed data for Phase 1 (UI development).
 *
 * This module emulates the shape of records that will be returned by the
 * Supabase-backed API in Phase 3. All dashboard statistics are DERIVED from
 * these records — no metric is a hardcoded number. In Phase 3 this file is
 * replaced by real `services/*.js` calls to the Express API + Supabase.
 */

const now = new Date()
const today = startOfDay(now)
const at = (dayOffset, hour, minute = 0) =>
  setMinutes(setHours(addDays(today, dayOffset), hour), minute).toISOString()

export const users = [{ id: 'demo-user', fullName: 'Your Name', email: 'you@example.com' }]

export const categories = [
  { id: 'cat-work', name: 'Work', color: '#0d9488' },
  { id: 'cat-personal', name: 'Personal', color: '#6366f1' },
  { id: 'cat-health', name: 'Health', color: '#f59e0b' },
  { id: 'cat-learning', name: 'Learning', color: '#ec4899' },
]

export const projects = [
  {
    id: 'proj-planora',
    name: 'Planora Launch',
    description: 'Ship the first public release of the planner.',
    status: 'active',
    startDate: at(-21, 9),
    deadline: at(24, 18),
  },
  {
    id: 'proj-portfolio',
    name: 'Portfolio Refresh',
    description: 'Redesign the personal portfolio site.',
    status: 'active',
    startDate: at(-10, 9),
    deadline: at(10, 18),
  },
  {
    id: 'proj-fitness',
    name: 'Get Fit Q3',
    description: 'Consistent training and nutrition plan.',
    status: 'active',
    startDate: at(-40, 7),
    deadline: at(50, 20),
  },
]

export const tasks = [
  {
    id: 't-1',
    title: 'Design dashboard layout',
    status: 'completed',
    priority: 'high',
    categoryId: 'cat-work',
    projectId: 'proj-planora',
    dueDate: at(0, 17),
    completedAt: at(0, 11),
    createdAt: at(-6, 9),
  },
  {
    id: 't-2',
    title: 'Wire up sidebar navigation',
    status: 'completed',
    priority: 'medium',
    categoryId: 'cat-work',
    projectId: 'proj-planora',
    dueDate: at(-1, 17),
    completedAt: at(-1, 15),
    createdAt: at(-5, 10),
  },
  {
    id: 't-3',
    title: 'Review pull request #42',
    status: 'in_progress',
    priority: 'urgent',
    categoryId: 'cat-work',
    projectId: 'proj-planora',
    dueDate: at(0, 13),
    completedAt: null,
    createdAt: at(-2, 8),
  },
  {
    id: 't-4',
    title: 'Draft weekly report',
    status: 'todo',
    priority: 'medium',
    categoryId: 'cat-work',
    projectId: null,
    dueDate: at(1, 12),
    completedAt: null,
    createdAt: at(-1, 16),
  },
  {
    id: 't-5',
    title: 'Morning run — 5km',
    status: 'completed',
    priority: 'low',
    categoryId: 'cat-health',
    projectId: 'proj-fitness',
    dueDate: at(0, 7),
    completedAt: at(0, 7),
    createdAt: at(-1, 6),
  },
  {
    id: 't-6',
    title: 'Prepare client invoice',
    status: 'todo',
    priority: 'high',
    categoryId: 'cat-work',
    projectId: null,
    dueDate: at(-2, 17),
    completedAt: null,
    createdAt: at(-7, 9),
  },
  {
    id: 't-7',
    title: 'Read "Deep Work" chapter 3',
    status: 'in_progress',
    priority: 'low',
    categoryId: 'cat-learning',
    projectId: null,
    dueDate: at(2, 21),
    completedAt: null,
    createdAt: at(-3, 20),
  },
  {
    id: 't-8',
    title: 'Plan weekend groceries',
    status: 'completed',
    priority: 'low',
    categoryId: 'cat-personal',
    projectId: null,
    dueDate: at(-1, 18),
    completedAt: at(-1, 12),
    createdAt: at(-2, 11),
  },
  {
    id: 't-9',
    title: 'Refactor dashboard store',
    status: 'completed',
    priority: 'medium',
    categoryId: 'cat-work',
    projectId: 'proj-planora',
    dueDate: at(-3, 17),
    completedAt: at(-3, 14),
    createdAt: at(-4, 9),
  },
  {
    id: 't-10',
    title: 'Update portfolio case studies',
    status: 'todo',
    priority: 'medium',
    categoryId: 'cat-work',
    projectId: 'proj-portfolio',
    dueDate: at(3, 17),
    completedAt: null,
    createdAt: at(-2, 13),
  },
  {
    id: 't-11',
    title: 'Book dentist appointment',
    status: 'todo',
    priority: 'high',
    categoryId: 'cat-health',
    projectId: null,
    dueDate: at(-4, 9),
    completedAt: null,
    createdAt: at(-8, 9),
  },
  {
    id: 't-12',
    title: 'Set up CI pipeline',
    status: 'completed',
    priority: 'high',
    categoryId: 'cat-work',
    projectId: 'proj-planora',
    dueDate: at(-2, 17),
    completedAt: at(-2, 16),
    createdAt: at(-6, 14),
  },
  {
    id: 't-13',
    title: 'Write tests for task module',
    status: 'todo',
    priority: 'urgent',
    categoryId: 'cat-work',
    projectId: 'proj-planora',
    dueDate: at(1, 17),
    completedAt: null,
    createdAt: at(-1, 9),
  },
  {
    id: 't-14',
    title: 'Meal prep for the week',
    status: 'completed',
    priority: 'medium',
    categoryId: 'cat-health',
    projectId: 'proj-fitness',
    dueDate: at(-1, 20),
    completedAt: at(-1, 19),
    createdAt: at(-3, 18),
  },
  {
    id: 't-15',
    title: 'Reply to emails',
    status: 'completed',
    priority: 'low',
    categoryId: 'cat-work',
    projectId: null,
    dueDate: at(0, 12),
    completedAt: at(0, 12),
    createdAt: at(0, 9),
  },
  {
    id: 't-16',
    title: 'Sketch portfolio hero section',
    status: 'in_progress',
    priority: 'high',
    categoryId: 'cat-work',
    projectId: 'proj-portfolio',
    dueDate: at(2, 17),
    completedAt: null,
    createdAt: at(-2, 15),
  },
  {
    id: 't-17',
    title: 'Renew gym membership',
    status: 'completed',
    priority: 'low',
    categoryId: 'cat-health',
    projectId: 'proj-fitness',
    dueDate: at(-5, 18),
    completedAt: at(-5, 12),
    createdAt: at(-6, 10),
  },
  {
    id: 't-18',
    title: 'Prepare October budget',
    status: 'todo',
    priority: 'medium',
    categoryId: 'cat-personal',
    projectId: null,
    dueDate: at(5, 18),
    completedAt: null,
    createdAt: at(-1, 20),
  },
]

export const goals = [
  {
    id: 'goal-1',
    title: 'Ship Planora v1',
    description: 'Complete and launch the planner.',
    progress: 60,
    status: 'active',
    targetDate: at(30, 18),
    targetValue: 100,
    currentValue: 60,
  },
  {
    id: 'goal-2',
    title: 'Read 12 books',
    description: 'One book per month.',
    progress: 42,
    status: 'active',
    targetDate: at(180, 18),
    targetValue: 12,
    currentValue: 5,
  },
  {
    id: 'goal-3',
    title: 'Run a half marathon',
    description: 'Train consistently.',
    progress: 75,
    status: 'active',
    targetDate: at(45, 8),
    targetValue: 21,
    currentValue: 16,
  },
]

export const events = [
  {
    id: 'e-1',
    title: 'Standup',
    startTime: at(0, 9, 30),
    endTime: at(0, 10),
    allDay: false,
    projectId: 'proj-planora',
  },
  {
    id: 'e-2',
    title: 'Design review',
    startTime: at(0, 14),
    endTime: at(0, 15),
    allDay: false,
    projectId: 'proj-planora',
  },
  {
    id: 'e-3',
    title: 'Gym session',
    startTime: at(0, 18),
    endTime: at(0, 19, 30),
    allDay: false,
    projectId: 'proj-fitness',
  },
  {
    id: 'e-4',
    title: 'Deep work block',
    startTime: at(1, 9),
    endTime: at(1, 12),
    allDay: false,
    projectId: 'proj-portfolio',
  },
]

export const activities = [
  { id: 'a-1', type: 'task_completed', label: 'Completed "Design dashboard layout"', at: at(0, 11) },
  { id: 'a-2', type: 'task_completed', label: 'Completed "Morning run — 5km"', at: at(0, 7) },
  { id: 'a-3', type: 'task_created', label: 'Created "Write tests for task module"', at: at(-1, 9) },
  { id: 'a-4', type: 'goal_updated', label: 'Updated goal "Run a half marathon" to 75%', at: at(-1, 18) },
  { id: 'a-5', type: 'task_completed', label: 'Completed "Refactor dashboard store"', at: at(-3, 14) },
]

export const goalMilestones = [
  { id: 'gm-1', goalId: 'goal-1', title: 'Database schema', completed: true, dueDate: at(-10, 18), sortOrder: 0 },
  { id: 'gm-2', goalId: 'goal-1', title: 'Authentication', completed: true, dueDate: at(-3, 18), sortOrder: 1 },
  { id: 'gm-3', goalId: 'goal-1', title: 'Task CRUD', completed: false, dueDate: at(7, 18), sortOrder: 2 },
  { id: 'gm-4', goalId: 'goal-1', title: 'Deploy to production', completed: false, dueDate: at(30, 18), sortOrder: 3 },
  { id: 'gm-5', goalId: 'goal-2', title: 'Read 6 books', completed: true, dueDate: at(-20, 18), sortOrder: 0 },
  { id: 'gm-6', goalId: 'goal-2', title: 'Read 12 books', completed: false, dueDate: at(150, 18), sortOrder: 1 },
]

export const notes = [
  {
    id: 'n-1',
    title: 'Project kickoff notes',
    content: 'Scope, milestones and owners for the Planora launch. Prioritise dashboard and tasks.',
    categoryId: 'cat-work',
    tags: ['planora', 'kickoff'],
    createdAt: at(-4, 10),
    updatedAt: at(-1, 9),
  },
  {
    id: 'n-2',
    title: 'Book highlights — Deep Work',
    content: 'Deep work is the ability to focus without distraction on a demanding task.',
    categoryId: 'cat-learning',
    tags: ['reading', 'focus'],
    createdAt: at(-3, 21),
    updatedAt: at(-3, 21),
  },
  {
    id: 'n-3',
    title: 'Weekend trip ideas',
    content: 'Mountain cabin, coastal drive, or a city break. Check dates in October.',
    categoryId: 'cat-personal',
    tags: ['personal'],
    createdAt: at(-2, 15),
    updatedAt: at(-2, 15),
  },
]

export const reminders = [
  {
    id: 'r-1',
    taskId: 't-3',
    eventId: null,
    message: 'Review pull request #42',
    remindAt: at(0, 12, 30),
    channel: 'in_app',
    status: 'pending',
  },
  {
    id: 'r-2',
    taskId: 't-13',
    eventId: null,
    message: 'Write tests for task module',
    remindAt: at(1, 9),
    channel: 'email',
    status: 'pending',
  },
  {
    id: 'r-3',
    taskId: null,
    eventId: 'e-2',
    message: 'Design review starts soon',
    remindAt: at(0, 13, 45),
    channel: 'in_app',
    status: 'sent',
  },
]

/** @returns {Promise<object>} the current workspace snapshot */
export async function fetchWorkspace() {
  return {
    tasks,
    projects,
    goals,
    events,
    categories,
    activities,
  }
}
