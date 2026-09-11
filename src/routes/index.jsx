import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'

// Public pages
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
// Private pages
import DashboardPage from '../pages/DashboardPage'
import TasksPage from '../pages/TasksPage'
import FocusPage from '../pages/FocusPage'
import ActivityPage from '../pages/ActivityPage'
import ProgressPage from '../pages/ProgressPage'
import NavratriJourneyPage from '../pages/NavratriJourneyPage'
import SettingsPage from '../pages/SettingsPage'

function privateRoute(element) {
  return (
    <PrivateRoute>
      <AppLayout>{element}</AppLayout>
    </PrivateRoute>
  )
}

function publicRoute(element) {
  return <PublicRoute>{element}</PublicRoute>
}

const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: publicRoute(<LoginPage />) },
  { path: '/signup', element: publicRoute(<SignupPage />) },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  // ── Private (wrapped in AppLayout + PrivateRoute) ──
  { path: '/dashboard', element: privateRoute(<DashboardPage />) },
  { path: '/tasks', element: privateRoute(<TasksPage />) },
  { path: '/focus', element: privateRoute(<FocusPage />) },
  { path: '/activity', element: privateRoute(<ActivityPage />) },
  { path: '/progress', element: privateRoute(<ProgressPage />) },
  { path: '/journey', element: privateRoute(<NavratriJourneyPage />) },
  { path: '/settings', element: privateRoute(<SettingsPage />) },
])

export default router
