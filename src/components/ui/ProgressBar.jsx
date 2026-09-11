/**
 * ProgressBar — accessible horizontal progress indicator.
 *
 * @param {{ value: number, label?: string, className?: string } & React.HTMLAttributes<HTMLDivElement>} props
 */
export default function ProgressBar({ value = 0, label, className = '', ...props }) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={`space-y-1 ${className}`} {...props}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-muted)]">{label}</span>
          <span className="text-xs tabular-nums text-[var(--color-muted)]">{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-elevated)]"
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
