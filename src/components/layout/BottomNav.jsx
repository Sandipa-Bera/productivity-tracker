import NavItem from './NavItem'
import { NAV_ITEMS } from '../../constants/navigation'

/**
 * BottomNav — mobile-only bottom navigation bar.
 * Shown below 768px, hidden on md+.
 *
 * @param {{ onNavigate?: () => void }} props
 */
export default function BottomNav({ onNavigate }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.path}
          icon={item.icon}
          label={item.label}
          path={item.path}
          collapsed={true}
          onClick={onNavigate}
        />
      ))}
    </nav>
  )
}
