import NavItem from './NavItem'
import { NAV_ITEMS } from '../../constants/navigation'

/**
 * Sidebar — desktop navigation.
 * Full width (220px) on desktop, icon-only (60px) on tablet.
 *
 * @param {{ collapsed: boolean }} props
 */
export default function Sidebar({ collapsed }) {
  return (
    <aside
      aria-label="Main navigation"
      style={{
        display: 'none',
        flexDirection: 'column',
        flexShrink: 0,
        width: collapsed ? 60 : 220,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border-light)',
        transition: 'width 200ms ease',
      }}
      className="sidebar-desktop"
    >
      {/* Logo / wordmark */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '18px 0' : '18px 20px',
          borderBottom: '1px solid var(--border-light)',
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <span
            aria-label="Productivity app"
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--blue-soft)',
              color: 'var(--blue)',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '-0.02em',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            P
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--blue-soft)',
                color: 'var(--blue)',
                borderRadius: 7,
                fontWeight: 700,
                fontSize: 13,
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              P
            </span>
            <span
              style={{
                color: 'var(--text)',
                fontWeight: 650,
                fontSize: 14,
                letterSpacing: '-0.02em',
                userSelect: 'none',
              }}
            >
              Productivity
            </span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav
        style={{
          flex: 1,
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  )
}
