import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGymInfo } from '../context/GymInfoContext'
import toast from 'react-hot-toast'
import { Dumbbell, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { validateEmail, validateRequired } from '../services/validation'
import FieldError from '../components/FieldError'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { gymInfo } = useGymInfo()
  const gymName = gymInfo?.gymName || 'GymPro'
  const gymLogo = gymInfo?.logoBase64 || null

  const validate = () => {
    const e = {}
    const emailErr = validateEmail(form.email)
    if (emailErr) e.email = emailErr
    const passErr = validateRequired(form.password, 'Password')
    if (passErr) e.password = passErr
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome, ${user.fullName}!`)
      navigate(user.role === 'Admin' ? '/admin' : user.role === 'Coach' ? '/coach' : '/trainee')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password'
      toast.error(msg)
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gym-bg flex items-center justify-center p-4" dir="ltr">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gym-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gym-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gym-primary rounded-2xl text-4xl mb-4 pulse-glow overflow-hidden">
            {gymLogo
              ? <img src={gymLogo} className="w-full h-full object-contain" />
              : <span>🏋️</span>
            }
          </div>
          <h1 className="text-4xl font-black text-white">{gymName}</h1>
          <p className="text-gym-muted mt-1">Professional Gym Management System</p>
        </div>

        {/* Card */}
        <div className="card glow">
          <div className="flex items-center gap-2 justify-center mb-6">
            <Lock size={18} className="text-gym-primary" />
            <h2 className="text-xl font-bold">Sign In</h2>
          </div>

          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 text-sm text-center">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="example@email.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                autoComplete="email"
              />
              <FieldError error={errors.email} />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gym-muted hover:text-gym-text"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FieldError error={errors.password} />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base mt-2"
              disabled={loading}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Dumbbell size={20} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gym-border text-center space-y-2">
            <p className="text-gym-muted text-sm">
              New trainee?{' '}
              <Link to="/register" className="text-gym-primary hover:underline font-semibold">
                Create Account
              </Link>
            </p>
            <p className="text-gym-muted/60 text-xs">
              Coaches — contact the gym reception to create your account
            </p>
          </div>
        </div>

        <p className="text-center text-gym-muted/40 text-xs mt-4">
          {gymName} &copy; {new Date().getFullYear()} — Gym Management System
        </p>
      </div>
    </div>
  )
}
