import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Sign in', guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: 'Create account', guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { title: 'Reset password', guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { title: 'New password' },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: 'Dashboard', requiresAuth: true },
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/views/TasksView.vue'),
        meta: { title: 'My Tasks', requiresAuth: true },
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('@/views/CalendarView.vue'),
        meta: { title: 'Calendar', requiresAuth: true },
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/ProjectsView.vue'),
        meta: { title: 'Projects', requiresAuth: true },
      },
      {
        path: 'goals',
        name: 'goals',
        component: () => import('@/views/GoalsView.vue'),
        meta: { title: 'Goals', requiresAuth: true },
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('@/views/CategoriesView.vue'),
        meta: { title: 'Categories', requiresAuth: true },
      },
      {
        path: 'notes',
        name: 'notes',
        component: () => import('@/views/NotesView.vue'),
        meta: { title: 'Notes', requiresAuth: true },
      },
      {
        path: 'reminders',
        name: 'reminders',
        component: () => import('@/views/RemindersView.vue'),
        meta: { title: 'Reminders', requiresAuth: true },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/views/ReportsView.vue'),
        meta: { title: 'Reports', requiresAuth: true },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: 'Settings', requiresAuth: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  // Before Supabase is configured the app runs in demo mode and never blocks.
  if (!isSupabaseConfigured) return true

  const auth = useAuthStore()
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} · Planora` : 'Planora'
})

export default router
