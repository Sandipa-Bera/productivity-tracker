import { NavLink } from 'react-router-dom'

/**
 * NavItem — single navigation link used in Sidebar and BottomNav.
 *
 * @param {{ icon: import('lucide-react').LucideIcon, label: string, path: string, collapsed?: boolean, onClick?: () => void }} props
 */
export default function NavItem({ icon: Icon, label, path, collapsed = false, onClick, className: extraClassName = '' }) {
  return (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
          'focus-visible:outline-[var(--color-accent)]',
          isActive
            ? 'bg-[var(--color-elevated)] text-[var(--color-text)] font-medium'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
          collapsed ? 'justify-center px-2' : '',
          extraClassName,
        ].join(' ')
      }
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon size={16} aria-hidden="true" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}
