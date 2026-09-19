import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Activity,
  TrendingUp,
  Settings,
  Calendar,
  Zap,
} from 'lucide-react'

/** @type {Array<{ label: string, path: string, icon: import('lucide-react').LucideIcon }>} */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Penalties', path: '/penalties', icon: Zap },
  { label: 'Focus', path: '/focus', icon: Timer },
  { label: 'Activity', path: '/activity', icon: Activity },
  { label: 'Progress', path: '/progress', icon: TrendingUp },
  { label: 'Journey', path: '/journey', icon: Calendar },
  { label: 'Settings', path: '/settings', icon: Settings },
]
