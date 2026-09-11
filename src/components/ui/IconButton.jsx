/**
 * IconButton — square button for icon-only actions.
 * Always requires an aria-label for accessibility.
 *
 * @param {{ size?: 'sm'|'md'|'lg', variant?: 'ghost'|'secondary', 'aria-label': string, className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function IconButton({
  size = 'md',
  variant = 'ghost',
  className = '',
  children,
  ...props
}) {
  const sizes = {
    sm: 'h-7 w-7 text-sm',
    md: 'h-8 w-8 text-base',
    lg: 'h-10 w-10 text-lg',
  }

  const variants = {
    ghost:     'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
    secondary: 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-elevated)]',
  }

  return (
    <button
      type="button"
      className={[
        'inline-flex items-center justify-center rounded-md transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-[var(--color-accent)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
