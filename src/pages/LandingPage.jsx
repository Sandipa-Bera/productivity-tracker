import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 py-16 bg-[var(--color-bg)]">
      <div className="text-center space-y-3 max-w-lg">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          Productivity
        </h1>
        <p className="text-[var(--color-muted)] leading-relaxed">
          A personal workspace for tasks, focused work sessions, and progress tracking.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          Sign in
        </Link>
        <Link
          to="/signup"
          className="px-5 py-2.5 rounded-md border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-surface)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          Create account
        </Link>
      </div>

      <p className="text-xs text-[var(--color-muted)]">Step 4 · Foundation scaffold</p>
    </main>
  )
}
