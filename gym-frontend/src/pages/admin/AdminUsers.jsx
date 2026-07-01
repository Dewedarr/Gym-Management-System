import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { UserPlus, Loader2, Search, ToggleLeft, ToggleRight, Trash2, Copy, CheckCircle, X } from 'lucide-react'
import FieldError from '../../components/FieldError'
import { validateName, validateEmail, validatePassword, validatePhone, runValidations } from '../../services/validation'

const ROLES = ['Admin', 'Coach']

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'Coach', phone: '' })
  const [formErrors, setFormErrors] = useState({})
  const [newCredentials, setNewCredentials] = useState(null)

  const fetchUsers = async () => {
    const params = {}
    if (search) params.search = search
    if (roleFilter) params.role = roleFilter
    const r = await api.get('/admin/users', { params })
    setUsers(r.data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [search, roleFilter])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#'
    let pass = ''
    pass += 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 22)]
    pass += '23456789'[Math.floor(Math.random() * 8)]
    for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)]
    return pass.split('').sort(() => Math.random() - 0.5).join('')
  }

  const addUser = async e => {
    e.preventDefault()
    const errs = runValidations({
      fullName: validateName(form.fullName),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      phone: validatePhone(form.phone),
    })
    if (Object.keys(errs).length) { setFormErrors(errs); return }

    try {
      const res = await api.post('/auth/register', form)
      toast.success('Account created successfully')

      if (form.role === 'Coach') {
        setNewCredentials({
          fullName: res.data.fullName,
          email: res.data.email,
          password: res.data.password,
          role: res.data.role
        })
      }

      setShowForm(false)
      setForm({ fullName: '', email: '', password: '', role: 'Coach', phone: '' })
      setFormErrors({})
      fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred'
      toast.error(msg)
    }
  }

  const handleFormChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (formErrors[field]) setFormErrors(e => ({ ...e, [field]: null }))
  }

  const toggleUser = async id => {
    await api.put(`/admin/users/${id}/toggle`)
    fetchUsers()
    toast.success('Updated successfully')
  }

  const deleteUser = async id => {
    if (!confirm('Are you sure you want to permanently delete this user and all their data?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const copy = text => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  const roleColor = r => ({
    Admin: 'bg-purple-500/20 text-purple-400',
    Coach: 'bg-blue-500/20 text-blue-400',
    Trainee: 'bg-gym-primary/20 text-gym-primary'
  })[r] || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gym-text">Users</h1>
          <p className="text-gym-muted text-sm">{users.length} users</p>
        </div>
        <button onClick={() => { setShowForm(s => !s); setFormErrors({}) }} className="btn-primary">
          <UserPlus size={18} /> Add Coach / Admin
        </button>
      </div>

      {/* ─── Credentials Modal ─── */}
      {newCredentials && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-gym-card border border-gym-green/40 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gym-border">
              <h2 className="font-black text-gym-text flex items-center gap-2">
                <CheckCircle size={20} className="text-gym-green" />
                Coach Account Created
              </h2>
              <button onClick={() => setNewCredentials(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gym-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-yellow-400 text-sm font-semibold">⚠️ Save these credentials and send them to the coach now</p>
                <p className="text-yellow-400/70 text-xs mt-1">The password will not be shown again</p>
              </div>

              <div className="space-y-3">
                <div className="bg-gym-bg rounded-xl p-3">
                  <p className="text-gym-muted text-xs mb-1">Name</p>
                  <p className="text-gym-text font-bold">{newCredentials.fullName}</p>
                </div>

                <div className="bg-gym-bg rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gym-muted text-xs mb-1">Email</p>
                      <p className="text-gym-text font-mono text-sm">{newCredentials.email}</p>
                    </div>
                    <button onClick={() => copy(newCredentials.email)} className="p-2 rounded-lg hover:bg-white/10 text-gym-muted hover:text-white">
                      <Copy size={15} />
                    </button>
                  </div>
                </div>

                <div className="bg-gym-bg rounded-xl p-3 border border-gym-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gym-muted text-xs mb-1">Password</p>
                      <p className="text-gym-primary font-mono font-bold text-lg">{newCredentials.password}</p>
                    </div>
                    <button onClick={() => copy(newCredentials.password)} className="p-2 rounded-lg hover:bg-gym-primary/20 text-gym-muted hover:text-gym-primary">
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const text = `GymPro Login Credentials\nEmail: ${newCredentials.email}\nPassword: ${newCredentials.password}`
                  copy(text)
                }}
                className="btn-primary w-full"
              >
                <Copy size={16} /> Copy All Credentials
              </button>

              <button onClick={() => setNewCredentials(null)} className="btn-secondary w-full">
                Done — Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Form ─── */}
      {showForm && (
        <div className="card glow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gym-text">Add New Coach or Admin</h3>
            <div className="bg-gym-bg rounded-lg p-2 text-xs text-gym-muted">
              📌 Trainees register themselves via the Register page
            </div>
          </div>

          <form onSubmit={addUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
            <div>
              <label className="label">Full Name *</label>
              <input className={`input ${formErrors.fullName ? 'border-red-500' : ''}`}
                value={form.fullName} onChange={e => handleFormChange('fullName', e.target.value)}
                placeholder="John Smith" />
              <FieldError error={formErrors.fullName} />
            </div>

            <div>
              <label className="label">Email *</label>
              <input type="email" className={`input ${formErrors.email ? 'border-red-500' : ''}`}
                value={form.email} onChange={e => handleFormChange('email', e.target.value)}
                placeholder="coach@gym.com" />
              <FieldError error={formErrors.email} />
            </div>

            <div>
              <label className="label">
                Password *
                <button type="button"
                  onClick={() => handleFormChange('password', generatePassword())}
                  className="ml-2 text-gym-primary text-xs hover:underline">
                  ⚡ Auto Generate
                </button>
              </label>
              <input className={`input font-mono ${formErrors.password ? 'border-red-500' : ''}`}
                value={form.password} onChange={e => handleFormChange('password', e.target.value)}
                placeholder="Min8Chars1" />
              <FieldError error={formErrors.password} />
              <p className="text-gym-muted text-xs mt-1">8+ characters + uppercase + number</p>
            </div>

            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => handleFormChange('role', e.target.value)}>
                <option value="Coach">Coach</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input className={`input ${formErrors.phone ? 'border-red-500' : ''}`}
                value={form.phone} onChange={e => handleFormChange('phone', e.target.value)}
                placeholder="01012345678" maxLength={11} />
              <FieldError error={formErrors.phone} />
            </div>

            <div className="flex items-end gap-3">
              <button type="submit" className="btn-primary flex-1">Create Account</button>
              <button type="button" onClick={() => { setShowForm(false); setFormErrors({}) }}
                className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Filters ─── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
          <input className="input pl-9" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Coach">Coach</option>
          <option value="Trainee">Trainee</option>
        </select>
      </div>

      {/* ─── Table ─── */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={30} className="animate-spin text-gym-primary" /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gym-bg text-gym-muted text-left">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3 font-semibold text-gym-text">{u.fullName}</td>
                    <td className="px-4 py-3 text-gym-muted text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-gym-muted text-xs">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${roleColor(u.role)}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleUser(u.id)}
                          className="p-1.5 rounded-lg bg-gym-bg hover:bg-white/10 transition-colors text-gym-muted hover:text-white"
                          title={u.isActive ? 'Deactivate' : 'Activate'}>
                          {u.isActive
                            ? <ToggleRight size={18} className="text-green-400" />
                            : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => deleteUser(u.id)}
                          className="p-1.5 rounded-lg bg-gym-bg hover:bg-red-500/10 transition-colors text-gym-muted hover:text-red-400"
                          title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p className="text-center text-gym-muted py-8">No users found</p>
          )}
        </div>
      )}
    </div>
  )
}
