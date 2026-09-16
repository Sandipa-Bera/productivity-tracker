import { NavLink } from 'react-router-dom'

/**
 * NavItem — single navigation link used in Sidebar and BottomNav.
 *
 * @param {{ icon: import('lucide-react').LucideIcon, label: string, path: string, collapsed?: boolean, onClick?: () => void, isBottomNav?: boolean }} props
 */
export default function NavItem({
  icon: Icon,
  label,
  path,
  collapsed = false,
  onClick,
  isBottomNav = false,
}) {
  return (
    <NavLink
      to={path}
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: isBottomNav ? '6px 0 2px' : collapsed ? '10px 0' : '9px 12px',
        flexDirection: isBottomNav ? 'column' : 'row',
        flex: isBottomNav ? 1 : undefined,
        borderRadius: isBottomNav ? 0 : 8,
        fontSize: isBottomNav ? 10 : 13.5,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--blue)' : 'var(--text-muted)',
        background: isActive && !isBottomNav ? 'var(--blue-soft)' : 'transparent',
        textDecoration: 'none',
        transition: 'color 120ms ease, background 120ms ease',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={isBottomNav ? 20 : 16}
            aria-hidden="true"
            style={{
              flexShrink: 0,
              color: isActive ? 'var(--blue)' : 'var(--text-muted)',
              transition: 'color 120ms ease',
            }}
          />
          {!collapsed && (
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          )}
          {isBottomNav && (
            <span
              style={{
                fontSize: 10,
                lineHeight: 1,
                marginTop: 2,
                color: isActive ? 'var(--blue)' : 'var(--text-muted)',
              }}
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
