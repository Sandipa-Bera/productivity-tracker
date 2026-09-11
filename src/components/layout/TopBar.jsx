import { Menu, X } from 'lucide-react'
import IconButton from '../ui/IconButton'

/**
 * TopBar — header bar shown across all breakpoints.
 *
 * @param {{ sidebarCollapsed: boolean, onToggleSidebar: () => void, title?: string }} props
 */
export default function TopBar({ sidebarCollapsed, onToggleSidebar, title }) {
  return (
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

      {/* Spacer — right-side actions can be added here in later steps */}
      <div className="ml-auto" />
    </header>
  )
}
