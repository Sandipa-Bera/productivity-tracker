import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PrivateRoute from './PrivateRoute'

// Public pages
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'

// Private pages
import DashboardPage from '../pages/DashboardPage'
import TasksPage from '../pages/TasksPage'
import FocusPage from '../pages/FocusPage'
import ActivityPage from '../pages/ActivityPage'
import ProgressPage from '../pages/ProgressPage'
import HistoryPage from '../pages/HistoryPage'
import SettingsPage from '../pages/SettingsPage'

function privateRoute(element) {
  return (
    <PrivateRoute>
      <AppLayout>{element}</AppLayout>
    </PrivateRoute>
  )
}

const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────
  { path: '/',                element: <LandingPage /> },
  { path: '/login',           element: <LoginPage /> },
  { path: '/signup',          element: <SignupPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },

  // ── Private (wrapped in AppLayout + PrivateRoute) ──
  { path: '/dashboard', element: privateRoute(<DashboardPage />) },
  { path: '/tasks',     element: privateRoute(<TasksPage />) },
  { path: '/focus',     element: privateRoute(<FocusPage />) },
  { path: '/activity',  element: privateRoute(<ActivityPage />) },
  { path: '/progress',  element: privateRoute(<ProgressPage />) },
  { path: '/history',   element: privateRoute(<HistoryPage />) },
  { path: '/settings',  element: privateRoute(<SettingsPage />) },
])

export default router
