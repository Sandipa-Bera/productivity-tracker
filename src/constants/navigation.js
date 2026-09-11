import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Activity,
  TrendingUp,
  History,
  Settings,
} from 'lucide-react'

/** @type {Array<{ label: string, path: string, icon: import('lucide-react').LucideIcon }>} */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Tasks',     path: '/tasks',     icon: CheckSquare },
  { label: 'Focus',     path: '/focus',     icon: Timer },
  { label: 'Activity',  path: '/activity',  icon: Activity },
  { label: 'Progress',  path: '/progress',  icon: TrendingUp },
  { label: 'History',   path: '/history',   icon: History },
  { label: 'Settings',  path: '/settings',  icon: Settings },
]
