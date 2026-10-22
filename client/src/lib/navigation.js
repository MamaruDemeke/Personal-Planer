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
      items: [
        { label: 'nav.dashboard', to: { name: 'dashboard' }, icon: LayoutDashboard },
        { label: 'nav.tasks', to: { name: 'tasks' }, icon: ListTodo },
      ],
    },
    {
      title: 'section.planning',
      items: [
        { label: 'nav.daily', to: { name: 'plan-daily' }, icon: CalendarDays },
        { label: 'nav.weekly', to: { name: 'plan-weekly' }, icon: CalendarRange },
        { label: 'nav.monthly', to: { name: 'plan-monthly' }, icon: CalendarClock },
        { label: 'nav.yearly', to: { name: 'plan-yearly' }, icon: Calendar },
      ],
    },
    {
      title: 'section.work',
      items: [
        { label: 'nav.progress', to: { name: 'progress' }, icon: TrendingUp },
        { label: 'nav.reports', to: { name: 'reports' }, icon: FileText },
        { label: 'nav.diary', to: { name: 'diary' }, icon: BookOpen },
        { label: 'nav.settings', to: { name: 'settings' }, icon: Settings },
      ],
    },
    {
      title: 'section.culture',
      items: [
        { label: 'nav.ethiopianCalendar', to: { name: 'ethiopian-calendar' }, icon: Calendar },
      ],
    },
  ]

  if (locked && !isAdmin) {
    sections.unshift({
      title: 'section.account',
      items: [{ label: 'nav.access', to: { name: 'access' }, icon: BadgeCheck }],
    })
  }

  if (isAdmin) {
    sections.push({
      title: 'section.administration',
      items: [{ label: 'nav.admin', to: { name: 'admin' }, icon: ShieldCheck }],
    })
  }

  return sections
}

export const navSections = buildNavSections()
