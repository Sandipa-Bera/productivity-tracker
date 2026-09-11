import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword, user } = useAuth()
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Check if we have a valid session (user should be authenticated via the reset link)
  const isValidSession = !!user

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setSubmitError('')
    
    const { error } = await updatePassword(formData.password)
    
    if (error) {
      if (error.message.includes('Auth session missing')) {
        setSubmitError('Invalid or expired reset link. Please request a new password reset.')
      } else {
        setSubmitError('An error occurred. Please try again.')
      }
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (submitError) {
      setSubmitError('')
    }
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-[var(--color-danger)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--color-danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
                Invalid reset link
              </h1>
              <p className="text-sm text-[var(--color-muted)]">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full"
              >
                Request new reset link
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Back to login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
                Password updated
              </h1>
              <p className="text-sm text-[var(--color-muted)]">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Go to login
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
              Set new password
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              Enter your new password below
            </p>
          </div>

          {submitError && (
            <div className="mb-6 p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-md">
              <p className="text-sm text-[var(--color-danger)]">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)]">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={[
                    'block w-full rounded-md border px-3 py-2 pr-10 text-sm bg-[var(--color-surface)] text-[var(--color-text)]',
                    'placeholder:text-[var(--color-muted)] transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent',
                    errors.password
                      ? 'border-[var(--color-danger)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-muted)]',
                  ].join(' ')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[var(--color-danger)]" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text)]">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={[
                    'block w-full rounded-md border px-3 py-2 pr-10 text-sm bg-[var(--color-surface)] text-[var(--color-text)]',
                    'placeholder:text-[var(--color-muted)] transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent',
                    errors.confirmPassword
                      ? 'border-[var(--color-danger)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-muted)]',
                  ].join(' ')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  aria-invalid={!!errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-[var(--color-danger)]" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update password'}
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