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

  // On tablet, sidebar collapses by default. On desktop, it's open by default.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.innerWidth < BREAKPOINTS.tablet
  )

  // Collapse sidebar automatically when viewport drops below desktop
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

  // Derive current page title from nav items
  const currentNav = NAV_ITEMS.find((item) => item.path === location.pathname)
  const pageTitle = currentNav?.label ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Desktop/tablet sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Right-side column: topbar + scrollable content */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          title={pageTitle}
        />

        {/* Main content area */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-5 py-5 pb-20 md:pb-5"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
