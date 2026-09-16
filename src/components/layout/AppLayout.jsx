import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { NAV_ITEMS } from '../../constants/navigation'
import { BREAKPOINTS } from '../../constants/theme'

/**
 * AppLayout — root shell for all private pages.
 *
 * Desktop (>1024px):  sidebar (full) + topbar + scrollable main
 * Tablet (768–1024px): sidebar (collapsed/icon-only) + topbar + main
 * Mobile (<768px):    topbar + main + bottom nav
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function AppLayout({ children }) {
  const location = useLocation()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.innerWidth < BREAKPOINTS.tablet
  )

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= BREAKPOINTS.tablet) {
        setSidebarCollapsed(false)
      } else if (window.innerWidth >= BREAKPOINTS.mobile) {
        setSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function toggleSidebar() {
    setSidebarCollapsed((prev) => !prev)
  }

  const currentNav = NAV_ITEMS.find((item) => item.path === location.pathname)
  const pageTitle = currentNav?.label ?? ''

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* Desktop/tablet sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Right-side column: topbar + scrollable content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <TopBar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          title={pageTitle}
        />

        {/* Main content area */}
        <main
          id="main-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 28px 100px',
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
