import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setSubmitError('')
    
    const { error } = await signIn(formData.email, formData.password)
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setSubmitError('Invalid email or password')
      } else if (error.message.includes('Email not confirmed')) {
        setSubmitError('Please confirm your email address')
      } else {
        setSubmitError('An error occurred. Please try again.')
      }
    } else {
      navigate('/dashboard')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
              Sign in
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              Enter your credentials to access your workspace
            </p>
          </div>

          {submitError && (
            <div className="mb-6 p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-md">
              <p className="text-sm text-[var(--color-danger)]">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)]">
                Password
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
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
