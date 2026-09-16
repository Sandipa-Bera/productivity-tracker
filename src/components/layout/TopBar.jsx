import { Menu, LogOut, User, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 52,
          flexShrink: 0,
          padding: '0 16px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        {/* Sidebar toggle button */}
        <button
          type="button"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid var(--border-light)',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-2)'
            e.currentTarget.style.color = 'var(--text)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.borderColor = 'var(--border-light)'
          }}
        >
          {sidebarCollapsed ? <Menu size={15} /> : <ChevronLeft size={15} />}
        </button>

        {/* Page title */}
        {title && (
          <h2
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </h2>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User info chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 10px 5px 8px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--blue-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={12} style={{ color: 'var(--blue)' }} />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text)',
                maxWidth: 140,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              className="user-name-hide-mobile"
            >
              {userDisplayName}
            </span>
          </div>

          {/* Logout button */}
          <button
            type="button"
            aria-label="Logout"
            title="Sign out"
            onClick={() => setShowConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border-light)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--red-soft)'
              e.currentTarget.style.color = 'var(--red)'
              e.currentTarget.style.borderColor = 'var(--red)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border-light)'
            }}
          >
            <LogOut size={14} />
          </button>
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
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(2px)',
            padding: 16,
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
              borderRadius: 14,
              padding: '28px 24px 24px',
              width: '100%',
              maxWidth: 400,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h2
              id="signout-dialog-title"
              style={{ margin: 0, fontSize: 16, fontWeight: 650, color: 'var(--text)', letterSpacing: '-0.02em' }}
            >
              Sign out?
            </h2>
            <p
              id="signout-dialog-desc"
              style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}
            >
              You'll need to log in again to access your workspace.
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: '1px solid transparent',
                  background: 'var(--red)',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'opacity 120ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
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
