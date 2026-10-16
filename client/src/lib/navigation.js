import {
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
 * included for administrators.
 */
export function buildNavSections({ isAdmin = false } = {}) {
  const sections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', to: { name: 'dashboard' }, icon: LayoutDashboard },
        { label: 'My Tasks', to: { name: 'tasks' }, icon: ListTodo },
      ],
    },
    {
      title: 'Planning',
      items: [
        { label: 'Daily', to: { name: 'plan-daily' }, icon: CalendarDays },
        { label: 'Weekly', to: { name: 'plan-weekly' }, icon: CalendarRange },
        { label: 'Monthly', to: { name: 'plan-monthly' }, icon: CalendarClock },
        { label: 'Yearly', to: { name: 'plan-yearly' }, icon: Calendar },
      ],
    },
    {
      title: 'Work',
      items: [
        { label: 'Progress', to: { name: 'progress' }, icon: TrendingUp },
        { label: 'Reports', to: { name: 'reports' }, icon: FileText },
        { label: 'Settings', to: { name: 'settings' }, icon: Settings },
      ],
    },
  ]

  if (isAdmin) {
    sections.push({
      title: 'Administration',
      items: [{ label: 'User verification', to: { name: 'admin' }, icon: ShieldCheck }],
    })
  }

  return sections
}

export const navSections = buildNavSections()
