/**
 * Input — labeled text input with optional error and helper text.
 *
 * @param {{ label: string, id: string, error?: string, helperText?: string, className?: string } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export default function Input({
  label,
  id,
  error,
  helperText,
  className = '',
  ...props
}) {
  const inputClass = [
    'block w-full rounded-md border px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]',
    'placeholder:text-[var(--color-muted)] transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent',
    error
      ? 'border-[var(--color-danger)]'
      : 'border-[var(--color-border)] hover:border-[var(--color-muted)]',
    className,
  ].join(' ')

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <input id={id} className={inputClass} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : helperText ? `${id}-hint` : undefined} {...props} />
      {error && (
        <p id={`${id}-error`} className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-muted)]">
          {helperText}
        </p>
      )}
    </div>
  )
}
