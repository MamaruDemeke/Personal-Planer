import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  FolderKanban,
  Target,
  Tags,
  NotebookPen,
  BellRing,
  BarChart3,
  Settings,
} from 'lucide-vue-next'

/** Sidebar navigation model. */
export const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'My Tasks', to: '/tasks', icon: CheckSquare },
  { name: 'Calendar', to: '/calendar', icon: CalendarDays },
  { name: 'Projects', to: '/projects', icon: FolderKanban },
  { name: 'Goals', to: '/goals', icon: Target },
  { name: 'Categories', to: '/categories', icon: Tags },
  { name: 'Notes', to: '/notes', icon: NotebookPen },
  { name: 'Reminders', to: '/reminders', icon: BellRing },
  { name: 'Reports', to: '/reports', icon: BarChart3 },
  { name: 'Settings', to: '/settings', icon: Settings },
]
