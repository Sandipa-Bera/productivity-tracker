/**
 * Shared placeholder for private pages.
 * Each page will be built out in its respective step.
 */
export default function PagePlaceholder({ title, description }) {
  return (
    <div className="space-y-2 p-1">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">{title}</h1>
      {description && (
        <p className="text-sm text-[var(--color-muted)]">{description}</p>
      )}
      <div className="mt-6 rounded-md border border-dashed border-[var(--color-border)] px-6 py-10 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          Content for this page will be implemented in a later step.
        </p>
      </div>
    </div>
  )
}
