import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, Save, Phone, MapPin, Clock, Mail, Wallet, Upload, X, Building2, CreditCard, Image, Plus, Trash2, Lock } from 'lucide-react'
import FieldError from '../../components/FieldError'
import { validatePhone, validateImageFile, fileToBase64 } from '../../services/validation'

export default function AdminGymSettings() {
  const [form, setForm] = useState({
    gymName: '', phone: '', whatsApp: '', address: '', googleMapsUrl: '',
    workingHours: '', email: '', instaPay: '', vodafoneCash: '', logoBase64: null,
    heroImageBase64: null, heroTitle: '', heroSubtitle: '', galleryImagesJson: null
  })
  const DEFAULT_FEATURES = [
    { url: '🏋️', caption: 'Professional Equipment' },
    { url: '🛁', caption: 'Jacuzzi' },
    { url: '🧖', caption: 'Sauna' },
    { url: '🥊', caption: 'Boxing Area' },
    { url: '🚿', caption: 'Changing Rooms' },
    { url: '📡', caption: 'Free WiFi' },
  ]
  const [gallery, setGallery] = useState(DEFAULT_FEATURES)
  const [branches, setBranches] = useState([{ name: '', address: '', mapsUrl: '' }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('identity')
  const logoRef = useRef()
  const heroRef = useRef()

  useEffect(() => {
    api.get('/payment/gym-info').then(r => {
      setForm({ ...r.data, logoBase64: r.data.logoBase64 || null, heroImageBase64: r.data.heroImageBase64 || null })
      try {
        const parsed = r.data.galleryImagesJson ? JSON.parse(r.data.galleryImagesJson) : []
        if (parsed.length > 0) {
          setGallery(parsed.map(p => ({ url: p.icon || p.url || '✅', caption: p.label || p.caption || '' })))
        }
      } catch { }
      try {
        const br = r.data.branchesJson ? JSON.parse(r.data.branchesJson) : []
        if (br.length > 0) setBranches(br)
      } catch { }
    }).finally(() => setLoading(false))
  }, [])

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const handleLogo = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const err = validateImageFile(file)
    if (err) { toast.error(err); return }
    const b64 = await fileToBase64(file)
    setForm(f => ({ ...f, logoBase64: b64 }))
  }

  const handleHero = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const isVideo = file.type.startsWith('video/')
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) { toast.error(isVideo ? 'Video exceeds 50MB' : 'Image exceeds 5MB'); return }
    const b64 = await fileToBase64(file)
    setForm(f => ({ ...f, heroImageBase64: b64 }))
  }

  const removeGallery = (i) => setGallery(g => g.filter((_, idx) => idx !== i))
  const updateCaption = (i, val) => setGallery(g => g.map((item, idx) => idx === i ? { ...item, caption: val } : item))

  const save = async e => {
    e.preventDefault()
    const errs = {}
    if (form.phone) { const e = validatePhone(form.phone); if (e) errs.phone = e }
    if (form.whatsApp && !/^2?01[0125][0-9]{8}$/.test(form.whatsApp)) errs.whatsApp = 'Invalid WhatsApp number (201xxxxxxxxx)'
    if (form.vodafoneCash) { const e = validatePhone(form.vodafoneCash); if (e) errs.vodafoneCash = e }
    if (form.instaPay) { const e = validatePhone(form.instaPay); if (e) errs.instaPay = e }
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await api.put('/payment/gym-settings', {
        ...form,
        galleryImagesJson: gallery.length > 0 ? JSON.stringify(gallery.map(f => ({ icon: f.url, label: f.caption }))) : null,
        branchesJson: branches.filter(b => b.name).length > 0 ? JSON.stringify(branches.filter(b => b.name)) : null
      })
      toast.success('Gym settings updated ✅')
    } catch { toast.error('An error occurred') }
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'identity',  label: 'Gym Identity',     icon: <Building2 size={15} /> },
    { id: 'payment',   label: 'Payment Info',      icon: <CreditCard size={15} /> },
    { id: 'branches',  label: 'Branches',          icon: <MapPin size={15} /> },
    { id: 'dashboard', label: 'Trainee Dashboard', icon: <Image size={15} /> },
    { id: 'security',  label: 'Security',          icon: <Lock size={15} /> },
  ]

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [savingPw, setSavingPw] = useState(false)

  const changePassword = async e => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.currentPassword) errs.currentPassword = 'Required'
    if (pwForm.newPassword.length < 8) errs.newPassword = 'At least 8 characters'
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setSavingPw(true)
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed successfully ✅')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwErrors({})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect current password')
    } finally { setSavingPw(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gym-border flex items-center justify-center overflow-hidden bg-gym-bg flex-shrink-0">
            {form.logoBase64 ? <img src={form.logoBase64} className="w-full h-full object-contain" /> : <span className="text-3xl">🏋️</span>}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gym-text">{form.gymName || 'Gym Settings'}</h1>
            <p className="text-gym-muted text-sm">Information displayed to users and payment details</p>
          </div>
        </div>

        <div className="flex gap-2 mt-5 border-t border-gym-border pt-4">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === t.id ? 'bg-gym-primary text-white' : 'text-gym-muted hover:text-gym-text'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        {activeTab === 'identity' && (
          <div className="card space-y-4">
            <h2 className="font-bold text-gym-text text-lg">Gym Identity</h2>

            <div>
              <label className="label">Gym Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gym-border flex items-center justify-center overflow-hidden bg-gym-bg flex-shrink-0">
                  {form.logoBase64 ? <img src={form.logoBase64} className="w-full h-full object-contain" /> : <span className="text-3xl">🏋️</span>}
                </div>
                <div className="space-y-2">
                  <button type="button" onClick={() => logoRef.current.click()} className="btn-secondary text-sm py-1.5 px-3">
                    <Upload size={14} /> Upload Logo
                  </button>
                  {form.logoBase64 && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, logoBase64: '' }))} className="flex items-center gap-1 text-red-400 text-xs hover:text-red-300">
                      <X size={12} /> Remove Logo
                    </button>
                  )}
                  <p className="text-gym-muted text-xs">PNG or JPG — max 5MB</p>
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </div>
            </div>

            <div>
              <label className="label">Gym Name</label>
              <input className="input" value={form.gymName || ''} onChange={e => handleChange('gymName', e.target.value)} placeholder="GymPro" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
                  <input className={`input pl-9 ${errors.phone ? 'border-red-500' : ''}`} value={form.phone || ''} onChange={e => handleChange('phone', e.target.value)} placeholder="01012345678" maxLength={11} />
                </div>
                <FieldError error={errors.phone} />
              </div>
              <div>
                <label className="label">WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 text-xs font-bold">WA</span>
                  <input className={`input pl-10 ${errors.whatsApp ? 'border-red-500' : ''}`} value={form.whatsApp || ''} onChange={e => handleChange('whatsApp', e.target.value)} placeholder="201012345678" />
                </div>
                <FieldError error={errors.whatsApp} />
                <p className="text-gym-muted text-xs mt-1">With country code: 201xxxxxxxxx</p>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
                  <input type="email" className="input pl-9" value={form.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="info@gym.com" />
                </div>
              </div>
              <div>
                <label className="label">Working Hours</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
                  <input className="input pl-9" value={form.workingHours || ''} onChange={e => handleChange('workingHours', e.target.value)} placeholder="6 AM - 12 AM" />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
                <input className="input pl-9" value={form.address || ''} onChange={e => handleChange('address', e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>

            <div>
              <label className="label">Google Maps URL</label>
              <input className="input" value={form.googleMapsUrl || ''} onChange={e => handleChange('googleMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." />
              <p className="text-gym-muted text-xs mt-1">Go to Google Maps → Share → Copy link</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Years of Experience</label>
                <input type="number" min="0" max="100" className="input"
                  value={form.yearsExperience || ''} onChange={e => handleChange('yearsExperience', parseInt(e.target.value) || 0)}
                  placeholder="e.g. 10" />
              </div>
            </div>

            <div>
              <label className="label">About the Gym</label>
              <textarea rows={3} className="input resize-none"
                value={form.aboutText || ''} onChange={e => handleChange('aboutText', e.target.value)}
                placeholder="A short description shown on the contact page..." />
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="card space-y-4">
            <h2 className="font-bold text-gym-text text-lg">Online Payment Info</h2>
            <div className="bg-gym-bg rounded-xl p-4 text-sm text-gym-muted">
              📋 This information will be shown to trainees during online payment. Make sure it is correct.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Vodafone Cash Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 text-xs font-bold">VF</span>
                  <input className={`input pl-10 ${errors.vodafoneCash ? 'border-red-500' : ''}`} value={form.vodafoneCash || ''} onChange={e => handleChange('vodafoneCash', e.target.value)} placeholder="01012345678" maxLength={11} />
                </div>
                <FieldError error={errors.vodafoneCash} />
              </div>
              <div>
                <label className="label">InstaPay Number</label>
                <div className="relative">
                  <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input className={`input pl-9 ${errors.instaPay ? 'border-red-500' : ''}`} value={form.instaPay || ''} onChange={e => handleChange('instaPay', e.target.value)} placeholder="01012345678" maxLength={11} />
                </div>
                <FieldError error={errors.instaPay} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gym-text text-lg">🏢 Branches</h2>
              <button type="button" onClick={() => setBranches(b => [...b, { name: '', address: '', mapsUrl: '' }])}
                className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
                <Plus size={14} /> Add Branch
              </button>
            </div>
            <p className="text-gym-muted text-sm">Each branch is shown in the top bar of the site</p>

            {branches.map((br, i) => (
              <div key={i} className="border border-gym-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gym-muted text-xs font-semibold">Branch {i + 1}</span>
                  {branches.length > 1 && (
                    <button type="button" onClick={() => setBranches(b => b.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gym-muted text-xs">Branch Name *</label>
                    <input className="input" placeholder="e.g. Maadi Branch"
                      value={br.name}
                      onChange={e => setBranches(b => b.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gym-muted text-xs">Address</label>
                    <input className="input" placeholder="e.g. 15 Nile St, Maadi"
                      value={br.address}
                      onChange={e => setBranches(b => b.map((x, j) => j === i ? { ...x, address: e.target.value } : x))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-gym-muted text-xs">Google Maps URL</label>
                  <input className="input" placeholder="https://maps.google.com/..."
                    value={br.mapsUrl}
                    onChange={e => setBranches(b => b.map((x, j) => j === i ? { ...x, mapsUrl: e.target.value } : x))} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="card space-y-4">
              <h2 className="font-bold text-gym-text text-lg">🎬 Home Page Background</h2>
              <p className="text-gym-muted text-sm">Upload an image or enter a direct MP4 video URL</p>

              <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-gym-border bg-gym-bg" style={{ aspectRatio: '3/1' }}>
                {form.heroImageBase64 ? (
                  <>
                    {(form.heroImageBase64.startsWith('http') || form.heroImageBase64.startsWith('data:video')) ? (
                      <video src={form.heroImageBase64} className="w-full h-full object-cover opacity-70" autoPlay loop muted playsInline />
                    ) : (
                      <img src={form.heroImageBase64} className="w-full h-full object-cover opacity-70" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, heroImageBase64: null }))}
                      className="absolute top-2 right-2 bg-red-500/90 text-white rounded-lg p-1.5 hover:bg-red-600">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl">🎬</span>
                    <p className="text-gym-muted text-sm">No background set — default image will be used</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button type="button" onClick={() => heroRef.current.click()} className="btn-secondary text-sm py-2 px-4">
                  <Upload size={14} /> {form.heroImageBase64 && !form.heroImageBase64.startsWith('http') ? 'Change Image' : 'Upload Image'}
                </button>
                <p className="text-gym-muted text-xs">PNG or JPG — max 5MB</p>
              </div>
              <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={handleHero} />

              <div className="border-t border-gym-border pt-4 space-y-2">
                <label className="text-gym-muted text-xs font-semibold">Or enter a direct MP4 video URL (instead of an image)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/gym-video.mp4"
                    className="input flex-1 text-sm"
                    value={form.heroImageBase64?.startsWith('http') ? form.heroImageBase64 : ''}
                    onChange={e => setForm(f => ({ ...f, heroImageBase64: e.target.value || null }))}
                  />
                  {form.heroImageBase64?.startsWith('http') && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, heroImageBase64: null }))}
                      className="btn-secondary text-sm py-2 px-3">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="text-gym-muted text-xs">Video loads directly from URL — much faster than uploading</p>
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gym-text text-lg">⭐ Gym Features</h2>
                  <p className="text-gym-muted text-sm">Shown at the bottom of the home page — max 6 features</p>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${gallery.length >= 6 ? 'bg-red-500/20 text-red-400' : 'bg-gym-primary/20 text-gym-primary'}`}>
                  {gallery.length}/6
                </span>
              </div>

              <div className="space-y-2">
                {gallery.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gym-bg rounded-xl px-3 py-2.5 border border-gym-border">
                    <input
                      className="w-12 bg-transparent text-center text-xl outline-none"
                      value={f.url}
                      onChange={e => setGallery(g => g.map((item, idx) => idx === i ? { ...item, url: e.target.value } : item))}
                      placeholder="🏋️"
                    />
                    <div className="w-px h-6 bg-gym-border" />
                    <input
                      className="flex-1 bg-transparent text-gym-text text-sm outline-none"
                      value={f.caption}
                      onChange={e => updateCaption(i, e.target.value)}
                      placeholder="Feature name (e.g. Jacuzzi)"
                    />
                    <button type="button" onClick={() => removeGallery(i)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {gallery.length === 0 && (
                <div className="bg-gym-bg rounded-xl p-6 text-center border-2 border-dashed border-gym-border">
                  <p className="text-gym-muted text-sm">No features — default features will be shown</p>
                </div>
              )}

              {gallery.length < 6 && (
                <button type="button"
                  onClick={() => setGallery(g => [...g, { url: '✅', caption: '' }])}
                  className="w-full py-3 border-2 border-dashed border-gym-primary/40 rounded-xl text-gym-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gym-primary/5 transition-colors">
                  <Plus size={16} /> Add Feature
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab !== 'security' && (
          <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </form>

      {/* Security Tab */}
      {activeTab === 'security' && (
        <form onSubmit={changePassword} className="card space-y-5">
          <h2 className="font-bold text-white text-lg border-b border-gym-border pb-3 flex items-center gap-2">
            <Lock size={18} className="text-gym-primary" /> Change Admin Password
          </h2>
          <div className="space-y-4 max-w-md">
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
            <button type="submit" className="btn-primary" disabled={savingPw}>
              {savingPw ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {savingPw ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
