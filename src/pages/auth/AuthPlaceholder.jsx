/**
 * Auth page placeholder — reused for Login, Signup, ForgotPassword.
 * Real form implementation is Step 5.
 */
export default function AuthPlaceholder({ title, description }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{title}</h1>
          <p className="text-sm text-[var(--color-muted)]">{description}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            Authentication UI will be implemented in Step 5.
          </p>
        </div>
      </div>
    </main>
  )
}
