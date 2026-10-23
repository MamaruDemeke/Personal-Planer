import {
  BadgeCheck,
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  FileText,
  LayoutDashboard,
  ListTodo,
  Settings,
  ShieldCheck,
  TrendingUp,
} from 'lucide-vue-next'

/**
 * Sidebar navigation, grouped into sections. Each item's `to` is a router
 * location and `icon` is a lucide component. The Admin section is only
 * included for administrators. A `locked` (unpaid/unapproved) account can still
 * browse every section, so it additionally gets a prominent payment entry.
 */
export function buildNavSections({ isAdmin = false, locked = false } = {}) {
  const sections = [
    {
      title: 'section.overview',
      color: '#0d9488',
      items: [
        { label: 'nav.dashboard', to: { name: 'dashboard' }, icon: LayoutDashboard, color: '#0d9488' },
        { label: 'nav.tasks', to: { name: 'tasks' }, icon: ListTodo, color: '#3b82f6' },
      ],
    },
    {
      title: 'section.planning',
      color: '#6366f1',
      items: [
        { label: 'nav.daily', to: { name: 'plan-daily' }, icon: CalendarDays, color: '#3b82f6' },
        { label: 'nav.weekly', to: { name: 'plan-weekly' }, icon: CalendarRange, color: '#8b5cf6' },
        { label: 'nav.monthly', to: { name: 'plan-monthly' }, icon: CalendarClock, color: '#f59e0b' },
        { label: 'nav.yearly', to: { name: 'plan-yearly' }, icon: Calendar, color: '#22c55e' },
      ],
    },
    {
      title: 'section.work',
      color: '#ec4899',
      items: [
        { label: 'nav.progress', to: { name: 'progress' }, icon: TrendingUp, color: '#06b6d4' },
        { label: 'nav.reports', to: { name: 'reports' }, icon: FileText, color: '#6366f1' },
        { label: 'nav.diary', to: { name: 'diary' }, icon: BookOpen, color: '#ec4899' },
        { label: 'nav.settings', to: { name: 'settings' }, icon: Settings, color: '#64748b' },
      ],
    },
    {
      title: 'section.culture',
      color: '#f97316',
      items: [
        { label: 'nav.ethiopianCalendar', to: { name: 'ethiopian-calendar' }, icon: Calendar, color: '#f97316' },
      ],
    },
  ]

  if (locked && !isAdmin) {
    sections.unshift({
      title: 'section.account',
      color: '#e11d48',
      items: [{ label: 'nav.access', to: { name: 'access' }, icon: BadgeCheck, color: '#e11d48' }],
    })
  }

  if (isAdmin) {
    sections.push({
      title: 'section.administration',
      color: '#ef4444',
      items: [{ label: 'nav.admin', to: { name: 'admin' }, icon: ShieldCheck, color: '#ef4444' }],
    })
  }

  return sections
}

export const navSections = buildNavSections()
