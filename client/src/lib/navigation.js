import {
  LayoutDashboard,
  CheckSquare,
  CalendarRange,
  CalendarDays,
  FolderKanban,
  Target,
  Tags,
  NotebookPen,
  BellRing,
  BarChart3,
  Settings,
} from 'lucide-vue-next'

/** Sidebar navigation model. `accent` gives each destination its own color. */
export const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, accent: '#0d9488' },
  { name: 'My Tasks', to: '/tasks', icon: CheckSquare, accent: '#0ea5e9' },
  { name: 'Plans', to: '/plans', icon: CalendarRange, accent: '#d946ef' },
  { name: 'Calendar', to: '/calendar', icon: CalendarDays, accent: '#8b5cf6' },
  { name: 'Projects', to: '/projects', icon: FolderKanban, accent: '#6366f1' },
  { name: 'Goals', to: '/goals', icon: Target, accent: '#f59e0b' },
  { name: 'Categories', to: '/categories', icon: Tags, accent: '#ec4899' },
  { name: 'Notes', to: '/notes', icon: NotebookPen, accent: '#22c55e' },
  { name: 'Reminders', to: '/reminders', icon: BellRing, accent: '#f43f5e' },
  { name: 'Reports', to: '/reports', icon: BarChart3, accent: '#06b6d4' },
  { name: 'Settings', to: '/settings', icon: Settings, accent: '#64748b' },
]
