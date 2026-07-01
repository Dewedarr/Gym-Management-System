import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Dumbbell, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import FieldError from '../components/FieldError'
import {
  validateName, validateEmail, validatePassword,
  validatePhone, runValidations
} from '../services/validation'

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', phone: ''
  })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const errs = runValidations({
      fullName: validateName(form.fullName),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      phone: validatePhone(form.phone),
    })
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/register-trainee', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || null
      })
      toast.success('Account created successfully! 🎉')
      const user = await login(form.email, form.password)
      navigate('/trainee')
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred during registration'
      toast.error(msg)
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gym-primary rounded-2xl text-4xl mb-4 pulse-glow">
            🏋️
          </div>
          <h1 className="text-4xl font-black text-white">GymPro</h1>
          <p className="text-gym-muted mt-1">Join us and start your fitness journey</p>
        </div>

        <div className="card glow">
          <div className="flex items-center gap-2 justify-center mb-6">
            <UserPlus size={20} className="text-gym-primary" />
            <h2 className="text-xl font-bold">Create Trainee Account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Full Name *</label>
              <input
                className={`input ${errors.fullName ? 'border-red-500' : ''}`}
                placeholder="John Smith"
                value={form.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                autoComplete="name"
              />
              <FieldError error={errors.fullName} />
            </div>

            <div>
              <label className="label">Email *</label>
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
              <label className="label">Phone Number</label>
              <input
                className={`input ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="01012345678"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                maxLength={11}
              />
              <FieldError error={errors.phone} />
              <p className="text-gym-muted text-xs mt-1">Starts with 010, 011, 012 or 015</p>
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gym-muted hover:text-gym-text">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <FieldError error={errors.password} />
              <p className="text-gym-muted text-xs mt-1">At least 8 characters + uppercase letter + number</p>
            </div>

            <div>
              <label className="label">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`input pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gym-muted hover:text-gym-text">
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <FieldError error={errors.confirmPassword} />
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-base mt-2" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gym-border text-center">
            <p className="text-gym-muted text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-gym-primary hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gym-muted text-xs">
            📌 Coaches — accounts are created by gym management
          </p>
        </div>
      </div>
    </div>
  )
}
