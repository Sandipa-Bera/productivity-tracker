import NavItem from './NavItem'
import { NAV_ITEMS } from '../../constants/navigation'

/**
 * Sidebar — desktop navigation.
 * Full width (240px) on desktop, icon-only (56px) on tablet.
 *
 * @param {{ collapsed: boolean }} props
 */
export default function Sidebar({ collapsed }) {
  return (
    <aside
      aria-label="Main navigation"
      className={[
        'hidden md:flex flex-col flex-shrink-0',
        'border-r border-[var(--color-border)] bg-[var(--color-surface)]',
        'h-full overflow-y-auto',
        collapsed ? 'w-14' : 'w-60',
        'transition-[width] duration-200',
      ].join(' ')}
    >
      {/* Logo / wordmark */}
      <div
        className={[
          'flex items-center border-b border-[var(--color-border)] py-4',
          collapsed ? 'justify-center px-2' : 'px-4',
        ].join(' ')}
      >
        {collapsed ? (
          <span className="text-[var(--color-accent)] font-bold text-base select-none" aria-label="Productivity app">P</span>
        ) : (
          <span className="text-[var(--color-text)] font-semibold text-sm tracking-tight select-none">
            Productivity
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
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
