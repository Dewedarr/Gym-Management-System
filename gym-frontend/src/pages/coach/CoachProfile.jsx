import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, Save, Phone, MapPin, Users, DollarSign, Lock } from 'lucide-react'
import PhotoUpload from '../../components/PhotoUpload'
import FieldError from '../../components/FieldError'
import {
  validateName, validatePhone, validateMaxTrainees,
  validatePrice, runValidations
} from '../../services/validation'

export default function CoachProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [errors, setErrors] = useState({})
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})

  const [infoForm, setInfoForm] = useState({ fullName: '', phone: '', address: '', bio: '', profileImage: null, email: '' })
  const [settingsForm, setSettingsForm] = useState({ specialization: '', bio: '', maxPrivateTraineesPerMonth: 10, privateSessionPrice: 0 })

  useEffect(() => {
    Promise.all([api.get('/profile/me'), api.get('/coach/profile')])
      .then(([u, c]) => {
        setInfoForm({ fullName: u.data.fullName, phone: u.data.phone || '', address: u.data.address || '', bio: u.data.bio || '', profileImage: u.data.profileImage || null, email: u.data.email })
        setSettingsForm({ specialization: c.data.specialization || '', bio: c.data.bio || '', maxPrivateTraineesPerMonth: c.data.maxPrivateTraineesPerMonth, privateSessionPrice: c.data.privateSessionPrice })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleInfoChange = (f, v) => { setInfoForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(e => ({ ...e, [f]: null })) }
  const handleSettChange = (f, v) => { setSettingsForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(e => ({ ...e, [f]: null })) }

  const saveInfo = async e => {
    e.preventDefault()
    const errs = runValidations({
      fullName: validateName(infoForm.fullName),
      phone: validatePhone(infoForm.phone),
    })
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving('info')
    try {
      await api.put('/profile/update', {
        fullName: infoForm.fullName,
        phone: infoForm.phone || null,
        address: infoForm.address || null,
        bio: infoForm.bio || null,
        profileImageBase64: infoForm.profileImage?.startsWith('data:') ? infoForm.profileImage : null
      })
      toast.success('Personal info updated ✅')
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally { setSaving(null) }
  }

  const saveSettings = async e => {
    e.preventDefault()
    const errs = runValidations({
      maxPrivateTraineesPerMonth: validateMaxTrainees(settingsForm.maxPrivateTraineesPerMonth),
      privateSessionPrice: validatePrice(settingsForm.privateSessionPrice),
    })
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving('settings')
    try {
      await api.put('/profile/coach-settings', settingsForm)
      toast.success('Coach settings updated ✅')
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally { setSaving(null) }
  }

  const changePassword = async e => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.currentPassword) errs.currentPassword = 'Required'
    if (pwForm.newPassword.length < 8) errs.newPassword = 'At least 8 characters'
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setSaving('pw')
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed successfully ✅')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwErrors({})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect current password')
    } finally { setSaving(null) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black text-gym-text">My Profile</h1></div>

      <form onSubmit={saveInfo} className="card space-y-5">
        <h2 className="font-bold text-white text-lg border-b border-gym-border pb-3">Personal Information</h2>

        <div className="flex items-center gap-5">
          <PhotoUpload currentImage={infoForm.profileImage} onUpload={img => handleInfoChange('profileImage', img)} size="lg" />
          <div>
            <p className="font-bold text-gym-text text-lg">{infoForm.fullName}</p>
            <p className="text-gym-muted text-sm">{infoForm.email}</p>
            <p className="text-gym-muted text-xs mt-1">Click the icon to change photo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input className={`input ${errors.fullName ? 'border-red-500' : ''}`} value={infoForm.fullName} onChange={e => handleInfoChange('fullName', e.target.value)} />
            <FieldError error={errors.fullName} />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
              <input className={`input pl-9 ${errors.phone ? 'border-red-500' : ''}`} value={infoForm.phone} onChange={e => handleInfoChange('phone', e.target.value)} placeholder="01012345678" maxLength={11} />
            </div>
            <FieldError error={errors.phone} />
          </div>

          <div className="col-span-2">
            <label className="label">Address</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
              <input className="input pl-9" value={infoForm.address} onChange={e => handleInfoChange('address', e.target.value)} placeholder="City, Country" />
            </div>
          </div>

          <div className="col-span-2">
            <label className="label">Bio (shown to trainees)</label>
            <textarea className="input resize-none" rows={3} value={infoForm.bio} onChange={e => handleInfoChange('bio', e.target.value)} placeholder="Write about your experience and specialization..." />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving === 'info'}>
          {saving === 'info' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving === 'info' ? 'Saving...' : 'Save Info'}
        </button>
      </form>

      <form onSubmit={saveSettings} className="card space-y-5">
        <h2 className="font-bold text-white text-lg border-b border-gym-border pb-3">Coach Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Specialization</label>
            <input className="input" value={settingsForm.specialization} onChange={e => handleSettChange('specialization', e.target.value)} placeholder="e.g. Bodybuilding, Cardio..." />
          </div>

          <div>
            <label className="label">Private Session Price (EGP)</label>
            <div className="relative">
              <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
              <input type="number" className={`input pl-9 ${errors.privateSessionPrice ? 'border-red-500' : ''}`} value={settingsForm.privateSessionPrice} onChange={e => handleSettChange('privateSessionPrice', +e.target.value)} min={0} />
            </div>
            <FieldError error={errors.privateSessionPrice} />
          </div>

          <div>
            <label className="label">Max Trainees / Month</label>
            <div className="relative">
              <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
              <input type="number" className={`input pl-9 ${errors.maxPrivateTraineesPerMonth ? 'border-red-500' : ''}`} value={settingsForm.maxPrivateTraineesPerMonth} onChange={e => handleSettChange('maxPrivateTraineesPerMonth', +e.target.value)} min={1} max={100} />
            </div>
            <FieldError error={errors.maxPrivateTraineesPerMonth} />
            <p className="text-gym-muted text-xs mt-1">Number of private trainees you can accept per month</p>
          </div>

          <div className="col-span-2">
            <label className="label">Professional Bio (optional)</label>
            <textarea className="input resize-none" rows={2} value={settingsForm.bio} onChange={e => handleSettChange('bio', e.target.value)} placeholder="Years of experience, certifications, specializations..." />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving === 'settings'}>
          {saving === 'settings' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving === 'settings' ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={changePassword} className="card space-y-5">
        <h2 className="font-bold text-white text-lg border-b border-gym-border pb-3 flex items-center gap-2">
          <Lock size={18} className="text-gym-primary" /> Change Password
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Current Password *</label>
            <input type="password" className={`input ${pwErrors.currentPassword ? 'border-red-500' : ''}`}
              value={pwForm.currentPassword} onChange={e => { setPwForm(f => ({ ...f, currentPassword: e.target.value })); setPwErrors(p => ({ ...p, currentPassword: null })) }}
              placeholder="Enter current password" />
            {pwErrors.currentPassword && <p className="text-red-400 text-xs mt-1">{pwErrors.currentPassword}</p>}
          </div>
          <div>
            <label className="label">New Password *</label>
            <input type="password" className={`input ${pwErrors.newPassword ? 'border-red-500' : ''}`}
              value={pwForm.newPassword} onChange={e => { setPwForm(f => ({ ...f, newPassword: e.target.value })); setPwErrors(p => ({ ...p, newPassword: null })) }}
              placeholder="Min 8 characters" />
            {pwErrors.newPassword && <p className="text-red-400 text-xs mt-1">{pwErrors.newPassword}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password *</label>
            <input type="password" className={`input ${pwErrors.confirmPassword ? 'border-red-500' : ''}`}
              value={pwForm.confirmPassword} onChange={e => { setPwForm(f => ({ ...f, confirmPassword: e.target.value })); setPwErrors(p => ({ ...p, confirmPassword: null })) }}
              placeholder="Repeat new password" />
            {pwErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{pwErrors.confirmPassword}</p>}
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={saving === 'pw'}>
          {saving === 'pw' ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
          {saving === 'pw' ? 'Saving...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}
