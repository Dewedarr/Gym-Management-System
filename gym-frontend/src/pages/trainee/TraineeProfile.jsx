import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, Save, UserCheck, Phone, MapPin, Dumbbell, Target, Calendar, Lock } from 'lucide-react'
import PhotoUpload from '../../components/PhotoUpload'
import FieldError from '../../components/FieldError'
import {
  validateName, validatePhone, validateHeight,
  validateWeight, validateAge, runValidations
} from '../../services/validation'

const GOALS = [
  { value: 'lose weight', label: '🔥 Lose Weight' },
  { value: 'gain muscle', label: '💪 Build Muscle' },
  { value: 'maintain', label: '⚖️ Maintain Weight' },
  { value: 'improve fitness', label: '🏃 Improve Fitness' },
]

export default function TraineeProfile() {
  const [profile, setProfile] = useState(null)
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('info')

  const [infoForm, setInfoForm] = useState({ fullName: '', phone: '', address: '', bio: '', profileImage: null })
  const [bodyForm, setBodyForm] = useState({ height: '', weight: '', age: '', gender: 'male', fitnessGoal: '', coachId: '', trainingDurationMonths: 1 })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [trialSessionsUsed, setTrialSessionsUsed] = useState(0)

  const canChangeCoach = trialSessionsUsed < 2

  useEffect(() => {
    Promise.all([api.get('/profile/me'), api.get('/trainee/coaches')])
      .then(([p, c]) => {
        setProfile(p.data)
        setCoaches(c.data)
        const td = p.data.traineeData || {}
        setTrialSessionsUsed(td.trialSessionsUsed || 0)
        setInfoForm({ fullName: p.data.fullName || '', phone: p.data.phone || '', address: p.data.address || '', bio: p.data.bio || '', profileImage: p.data.profileImage || null })
        setBodyForm({
          height: td.height || '', weight: td.weight || '',
          age: td.age || '', gender: td.gender || 'male',
          fitnessGoal: td.fitnessGoal || '',
          coachId: td.coachId || '', trainingDurationMonths: td.trainingDurationMonths || 1
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleInfoChange = (field, val) => { setInfoForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: null })) }
  const handleBodyChange = (field, val) => { setBodyForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: null })) }

  const saveInfo = async e => {
    e.preventDefault()
    const errs = runValidations({ fullName: validateName(infoForm.fullName), phone: validatePhone(infoForm.phone) })
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving('info')
    try {
      await api.put('/profile/update', {
        fullName: infoForm.fullName, phone: infoForm.phone || null,
        address: infoForm.address || null, bio: infoForm.bio || null,
        profileImageBase64: infoForm.profileImage?.startsWith('data:') ? infoForm.profileImage : null
      })
      toast.success('Profile updated ✅')
    } catch (err) { toast.error(err.response?.data?.message || 'An error occurred') }
    finally { setSaving(null) }
  }

  const saveBody = async e => {
    e.preventDefault()
    const errs = runValidations({
      height: validateHeight(bodyForm.height ? +bodyForm.height : null),
      weight: validateWeight(bodyForm.weight ? +bodyForm.weight : null),
      age: validateAge(bodyForm.age ? +bodyForm.age : null),
    })
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving('body')
    try {
      await api.put('/profile/trainee-body', {
        height: bodyForm.height ? +bodyForm.height : null,
        weight: bodyForm.weight ? +bodyForm.weight : null,
        age: bodyForm.age ? +bodyForm.age : null,
        gender: bodyForm.gender, fitnessGoal: bodyForm.fitnessGoal || null,
        coachId: bodyForm.coachId ? +bodyForm.coachId : null,
        trainingDurationMonths: +bodyForm.trainingDurationMonths
      })
      toast.success('Body data updated ✅')
    } catch (err) { toast.error(err.response?.data?.message || 'An error occurred') }
    finally { setSaving(null) }
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

  const td = profile?.traineeData || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <PhotoUpload currentImage={infoForm.profileImage} onUpload={img => handleInfoChange('profileImage', img)} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-black text-gym-text">{infoForm.fullName}</h1>
            <p className="text-gym-muted text-sm mt-0.5">{profile?.email}</p>
            {td.coachName && (
              <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start">
                <UserCheck size={15} className="text-gym-green" />
                <span className="text-gym-green text-sm font-semibold">Coach: {td.coachName}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {td.height && <span className="badge bg-blue-500/15 text-blue-400">📏 {td.height} cm</span>}
              {td.weight && <span className="badge bg-gym-primary/15 text-gym-primary">⚖️ {td.weight} kg</span>}
              {td.age && <span className="badge bg-purple-500/15 text-purple-400">🎂 {td.age} yrs</span>}
              {td.fitnessGoal && <span className="badge bg-gym-green/15 text-gym-green">🎯 {GOALS.find(g => g.value === td.fitnessGoal)?.label || td.fitnessGoal}</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5 border-t border-gym-border pt-4">
          <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'info' ? 'bg-gym-primary text-white' : 'text-gym-muted hover:text-gym-text'}`}>
            Personal Info
          </button>
          <button onClick={() => setActiveTab('body')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'body' ? 'bg-gym-primary text-white' : 'text-gym-muted hover:text-gym-text'}`}>
            Body Data
          </button>
          <button onClick={() => setActiveTab('security')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-gym-primary text-white' : 'text-gym-muted hover:text-gym-text'}`}>
            🔒 Security
          </button>
        </div>
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'info' && (
        <form onSubmit={saveInfo} className="card space-y-4">
          <h2 className="font-bold text-gym-text text-lg">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className={`input ${errors.fullName ? 'border-red-500' : ''}`} value={infoForm.fullName} onChange={e => handleInfoChange('fullName', e.target.value)} placeholder="Full Name" />
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
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
                <input className="input pl-9" value={infoForm.address} onChange={e => handleInfoChange('address', e.target.value)} placeholder="e.g. Cairo, Egypt" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="label">Bio</label>
              <textarea className="input resize-none" rows={3} value={infoForm.bio} onChange={e => handleInfoChange('bio', e.target.value)} placeholder="Write a short bio about yourself..." />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving === 'info'}>
            {saving === 'info' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving === 'info' ? 'Saving...' : 'Save Info'}
          </button>
        </form>
      )}

      {/* Body Data Tab */}
      {activeTab === 'body' && (
        <form onSubmit={saveBody} className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-bold text-gym-text text-lg flex items-center gap-2"><Dumbbell size={18} className="text-gym-primary" />Measurements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Height (cm)</label>
                <input type="number" className={`input ${errors.height ? 'border-red-500' : ''}`} value={bodyForm.height} onChange={e => handleBodyChange('height', e.target.value)} placeholder="175" min={100} max={250} />
                <FieldError error={errors.height} />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input type="number" step="0.1" className={`input ${errors.weight ? 'border-red-500' : ''}`} value={bodyForm.weight} onChange={e => handleBodyChange('weight', e.target.value)} placeholder="75" min={20} max={300} />
                <FieldError error={errors.weight} />
              </div>
              <div>
                <label className="label">Age</label>
                <input type="number" className={`input ${errors.age ? 'border-red-500' : ''}`} value={bodyForm.age} onChange={e => handleBodyChange('age', e.target.value)} placeholder="25" min={5} max={100} />
                <FieldError error={errors.age} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Gender</label>
                <select className="input" value={bodyForm.gender} onChange={e => handleBodyChange('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="label flex items-center gap-1"><Target size={13} />Fitness Goal</label>
                <select className="input" value={bodyForm.fitnessGoal} onChange={e => handleBodyChange('fitnessGoal', e.target.value)}>
                  <option value="">Select your goal</option>
                  {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gym-text text-lg">Coach (Private Training)</h2>
              {!canChangeCoach && (
                <span className="text-xs bg-red-500/15 text-red-400 px-2 py-1 rounded-full font-semibold">🔒 Locked</span>
              )}
            </div>

            {!canChangeCoach ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🔒</span>
                <div>
                  <p className="font-bold text-red-400 text-sm">Trial Period Ended</p>
                  <p className="text-gym-muted text-xs mt-1">
                    You've used both trial sessions — you can no longer change your coach. If you have an issue, contact management.
                  </p>
                  {bodyForm.coachId && (
                    <p className="text-gym-green text-xs mt-2 font-semibold">
                      Current coach: {coaches.find(c => c.id === +bodyForm.coachId)?.fullName || '—'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${!bodyForm.coachId ? 'border-gym-primary bg-gym-primary/10' : 'border-gym-border'}`}>
                  <input type="radio" name="coach" value="" checked={!bodyForm.coachId} onChange={() => handleBodyChange('coachId', '')} className="hidden" />
                  <div className="w-10 h-10 bg-gym-bg rounded-xl flex items-center justify-center text-lg">🚫</div>
                  <div><p className="font-semibold text-gym-text text-sm">No Coach</p><p className="text-gym-muted text-xs">Self Training</p></div>
                </label>
                {coaches.map(c => (
                  <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${+bodyForm.coachId === c.id ? 'border-gym-primary bg-gym-primary/10' : 'border-gym-border hover:border-gym-primary/30'}`}>
                    <input type="radio" name="coach" value={c.id} checked={+bodyForm.coachId === c.id} onChange={() => handleBodyChange('coachId', c.id)} className="hidden" disabled={!c.isAvailable && +bodyForm.coachId !== c.id} />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-blue-500/20 flex-shrink-0">
                      {c.profileImage ? <img src={c.profileImage} className="w-full h-full object-cover" /> : <span>🎯</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gym-text text-sm truncate">{c.fullName}</p>
                      <p className="text-gym-muted text-xs">{c.specialization || 'General Fitness'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gym-gold font-bold text-sm">{c.privateSessionPrice} EGP/session</p>
                      <p className={`text-xs ${c.isAvailable ? 'text-gym-green' : 'text-red-400'}`}>{c.isAvailable ? `${c.maxPrivateTraineesPerMonth - c.currentTrainees} slots` : 'Full'}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {canChangeCoach && bodyForm.coachId && (
              <div>
                <label className="label flex items-center gap-1"><Calendar size={13} />Training Duration</label>
                <select className="input" value={bodyForm.trainingDurationMonths} onChange={e => handleBodyChange('trainingDurationMonths', e.target.value)}>
                  {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m === 1 ? '1 Month' : m === 12 ? '1 Year' : `${m} Months`}</option>)}
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving === 'body'}>
            {saving === 'body' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving === 'body' ? 'Saving...' : 'Save Body Data'}
          </button>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <form onSubmit={changePassword} className="card space-y-5">
          <h2 className="font-bold text-white text-lg border-b border-gym-border pb-3 flex items-center gap-2">
            <Lock size={18} className="text-gym-primary" /> Change Password
          </h2>
          <div className="space-y-4">
            <div>
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
          <button type="submit" className="btn-primary w-full" disabled={saving === 'pw'}>
            {saving === 'pw' ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {saving === 'pw' ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  )
}
