import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useAccessStore } from '@/stores/access'

const routes = [
  {
    path: '/access',
    name: 'access',
    component: () => import('@/views/AccessView.vue'),
    meta: { title: 'Verify access', requiresAuth: true, allowLocked: true },
  },
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
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: 'Dashboard', requiresAuth: true, allowLocked: true },
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/views/TasksView.vue'),
        meta: { title: 'My Tasks', requiresAuth: true },
      },
      {
        path: 'plan/daily',
        name: 'plan-daily',
        component: () => import('@/views/PlanView.vue'),
        meta: { title: 'Daily Plan', period: 'daily', requiresAuth: true },
      },
      {
        path: 'plan/weekly',
        name: 'plan-weekly',
        component: () => import('@/views/PlanView.vue'),
        meta: { title: 'Weekly Plan', period: 'weekly', requiresAuth: true },
      },
      {
        path: 'plan/monthly',
        name: 'plan-monthly',
        component: () => import('@/views/PlanView.vue'),
        meta: { title: 'Monthly Plan', period: 'monthly', requiresAuth: true },
      },
      {
        path: 'plan/yearly',
        name: 'plan-yearly',
        component: () => import('@/views/PlanView.vue'),
        meta: { title: 'Yearly Plan', period: 'yearly', requiresAuth: true },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/views/ReportsView.vue'),
        meta: { title: 'Daily Reports', requiresAuth: true },
      },
      {
        path: 'progress',
        name: 'progress',
        component: () => import('@/views/ProgressView.vue'),
        meta: { title: 'Progress & Reports', requiresAuth: true },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: 'Settings', requiresAuth: true },
      },
      {
        path: 'diary',
        name: 'diary',
        component: () => import('@/views/DiaryView.vue'),
        meta: { title: 'Personal Diary', requiresAuth: true },
      },
      {
        path: 'ethiopian-calendar',
        name: 'ethiopian-calendar',
        component: () => import('@/views/EthiopianCalendarView.vue'),
        meta: { title: 'Ethiopian Calendar', requiresAuth: true },
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('@/views/AdminView.vue'),
        meta: { title: 'Admin', requiresAuth: true, requiresAdmin: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  // Without Supabase configured there is no auth to enforce.
  if (!isSupabaseConfigured) return true

  const auth = useAuthStore()
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (!auth.isAuthenticated) return true

  // Resolve the account's role + payment/access state once per session.
  const access = useAccessStore()
  if (!access.loaded) await access.load()

  if (to.meta.allowLocked) return true

  if (to.meta.requiresAdmin && !access.isAdmin) {
    return { name: 'dashboard' }
  }
  return true
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} · Worker Planner` : 'Worker Planner'
})

export default router
