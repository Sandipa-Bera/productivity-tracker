import { Menu, X, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IconButton from '../ui/IconButton'
import { useAuth } from '../../hooks/useAuth'

/**
 * TopBar — header bar shown across all breakpoints.
 *
 * @param {{ sidebarCollapsed: boolean, onToggleSidebar: () => void, title?: string }} props
 */
export default function TopBar({ sidebarCollapsed, onToggleSidebar, title }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)

  // Called only after the user confirms
  const handleLogout = async () => {
    setShowConfirm(false)
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const userDisplayName = user?.user_metadata?.full_name || user?.email || 'User'

  return (
    <>
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-0 h-12 flex-shrink-0">
        {/* Sidebar toggle — visible on md+; hamburger on mobile */}
        <IconButton
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebar}
          size="sm"
        >
          {sidebarCollapsed ? <Menu size={16} /> : <X size={16} className="hidden md:block" />}
          <Menu size={16} className="md:hidden" />
        </IconButton>

        {title && (
          <h2 className="text-sm font-medium text-[var(--color-text)] truncate">{title}</h2>
        )}

        {/* User info and logout */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-elevated)] border border-[var(--color-border)]">
            <User size={14} className="text-[var(--color-muted)]" />
            <span className="text-sm text-[var(--color-text)] truncate max-w-[150px]">
              {userDisplayName}
            </span>
          </div>
          <IconButton
            aria-label="Logout"
            onClick={() => setShowConfirm(true)}
            size="sm"
            title="Logout"
          >
            <LogOut size={16} />
          </IconButton>
        </div>
      </header>

      {/* Sign-out confirmation dialog */}
      {showConfirm && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false) }}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowConfirm(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-dialog-title"
            aria-describedby="signout-dialog-desc"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h2
              id="signout-dialog-title"
              style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text)' }}
            >
              Are you sure you want to sign out?
            </h2>
            <p
              id="signout-dialog-desc"
              style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}
            >
              You will need to log in again to access your productivity workspace.
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: '1px solid transparent',
                  background: 'var(--red)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
