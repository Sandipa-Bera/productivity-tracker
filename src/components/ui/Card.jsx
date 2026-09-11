/**
 * Card — surface container.
 *
 * @param {{ elevated?: boolean, className?: string } & React.HTMLAttributes<HTMLDivElement>} props
 */
export default function Card({ elevated = false, className = '', children, ...props }) {
  const bg = elevated ? 'bg-[var(--color-elevated)]' : 'bg-[var(--color-surface)]'
  return (
    <div
      className={`rounded-lg border border-[var(--color-border)] ${bg} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
