import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * PublicRoute — guard for public-only routes (login, signup).
 * 
 * - Shows loading state while auth is being determined
 * - Redirects to /dashboard if user is already authenticated
 * - Renders children if user is not authenticated
 */
export default function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="text-[var(--color-muted)] text-sm">Loading...</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
