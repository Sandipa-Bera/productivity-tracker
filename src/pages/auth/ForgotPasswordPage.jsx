import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateEmail = () => {
    if (!email) {
      setError('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateEmail()) return
    
    setLoading(true)
    setError('')
    
    const { error } = await resetPassword(email)
    
    if (error) {
      setError('An error occurred. Please try again.')
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (error) {
      setError('')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
                Check your email
              </h1>
              <p className="text-sm text-[var(--color-muted)]">
                If an account exists for <span className="text-[var(--color-text)]">{email}</span>, 
                you'll receive a password reset link. Please check your inbox.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Back to login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
              Reset password
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              We'll send a reset link to your email address
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-md">
              <p className="text-sm text-[var(--color-danger)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              error={error}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-[var(--color-accent)] hover:opacity-80 transition-opacity"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
