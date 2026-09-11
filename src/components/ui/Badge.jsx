/**
 * Badge — inline status label.
 *
 * @param {{ variant?: 'default'|'success'|'warning'|'danger', className?: string } & React.HTMLAttributes<HTMLSpanElement>} props
 */
export default function Badge({ variant = 'default', className = '', children, ...props }) {
  const variants = {
    default: 'bg-[var(--color-elevated)] text-[var(--color-muted)] border border-[var(--color-border)]',
    success: 'bg-[#1a3a2a] text-[var(--color-success)] border border-[#1e4a32]',
    warning: 'bg-[#3a2a1a] text-[var(--color-warning)] border border-[#4a3520]',
    danger:  'bg-[#3a1a1a] text-[var(--color-danger)]  border border-[#4a2020]',
  }

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
