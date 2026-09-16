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
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border-light)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      className="bottom-nav-mobile"
    >
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.path}
          icon={item.icon}
          label={item.label}
          path={item.path}
          collapsed={true}
          onClick={onNavigate}
          isBottomNav={true}
        />
      ))}
    </nav>
  )
}
