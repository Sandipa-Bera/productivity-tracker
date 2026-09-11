/**
 * Button — primary interactive element.
 *
 * @param {{ variant?: 'primary'|'secondary'|'ghost'|'danger', size?: 'sm'|'md'|'lg', className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-[var(--color-accent)] text-white hover:opacity-90',
    secondary: 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-elevated)]',
    ghost:     'text-[var(--color-text)] hover:bg-[var(--color-surface)]',
    danger:    'bg-[var(--color-danger)] text-white hover:opacity-90',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-5 py-2.5',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
