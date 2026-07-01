import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, Edit2, X, Check, Search, Trash2 } from 'lucide-react'

const PAYMENT_STATUS = {
  0: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-400/15' },
  1: { label: 'Paid', color: 'text-gym-green', bg: 'bg-gym-green/15' },
  2: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/15' },
}
const PAYMENT_METHOD_LABELS = { 0: 'Cash', 1: 'Vodafone Cash', 2: 'InstaPay' }

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const deleteSubscription = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this subscription?')) return
    setDeleting(id)
    try {
      await api.delete(`/admin/subscriptions/${id}`)
      toast.success('Subscription deleted ✅')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally {
      setDeleting(null)
    }
  }

  const load = () => api.get('/admin/subscriptions').then(r => setSubs(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const startEdit = (s) => setEditing({
    id: s.id,
    isActive: s.isActive,
    paymentStatus: s.paymentStatus ?? 0,
    paymentMethod: s.paymentMethod ?? '',
    paymentReference: s.paymentReference ?? '',
    remainingSessionsThisMonth: s.remainingSessionsThisMonth ?? 0
  })

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/admin/subscriptions/${editing.id}/status`, {
        isActive: editing.isActive,
        paymentStatus: editing.paymentStatus,
        paymentMethod: editing.paymentMethod !== '' ? +editing.paymentMethod : null,
        paymentReference: editing.paymentReference || null,
        remainingSessionsThisMonth: +editing.remainingSessionsThisMonth
      })
      toast.success('Subscription updated ✅')
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const filtered = subs.filter(s =>
    (s.traineeName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.planName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gym-text">Subscriptions</h1>
          <p className="text-gym-muted text-sm">{subs.length} subscriptions</p>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
        <input className="input pl-9" placeholder="Search by trainee or plan..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={30} className="animate-spin text-gym-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gym-muted">No subscriptions found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const ps = PAYMENT_STATUS[s.paymentStatus ?? 0]
            const isEditing = editing?.id === s.id
            return (
              <div key={s.id} className={`card transition-all ${isEditing ? 'border-gym-primary/50 glow' : 'hover:border-gym-primary/20'}`}>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-gym-text">{s.traineeName || '???'}</p>
                      <span className="badge bg-gym-primary/15 text-gym-primary text-xs">{s.planName}</span>
                      <span className={`badge text-xs ${s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`badge text-xs ${ps.bg} ${ps.color}`}>{ps.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gym-muted flex-wrap">
                      <span>📅 {new Date(s.startDate).toLocaleDateString('en-GB')} → {new Date(s.endDate).toLocaleDateString('en-GB')}</span>
                      <span className="text-gym-gold font-bold">{s.paidAmount} EGP</span>
                      {s.paymentMethod != null && <span>{PAYMENT_METHOD_LABELS[s.paymentMethod]}</span>}
                      {s.paymentReference && <span>#{s.paymentReference}</span>}
                    </div>
                  </div>

                  {!isEditing ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gym-border text-gym-muted hover:text-gym-primary hover:border-gym-primary/40 text-xs font-semibold transition-colors">
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => deleteSubscription(s.id)} disabled={deleting === s.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors disabled:opacity-50">
                        {deleting === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />} Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={save} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gym-green/20 text-gym-green hover:bg-gym-green/30 text-xs font-bold transition-colors">
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />} Save
                      </button>
                      <button onClick={() => setEditing(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors">
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-gym-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="label">Subscription Status</label>
                      <select className="input" value={editing.isActive ? '1' : '0'} onChange={e => setEditing(p => ({ ...p, isActive: e.target.value === '1' }))}>
                        <option value="1">✅ Active</option>
                        <option value="0">❌ Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Payment Status</label>
                      <select className="input" value={editing.paymentStatus} onChange={e => setEditing(p => ({ ...p, paymentStatus: +e.target.value }))}>
                        <option value={0}>⏳ Pending</option>
                        <option value={1}>✅ Paid</option>
                        <option value={2}>❌ Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Payment Method</label>
                      <select className="input" value={editing.paymentMethod} onChange={e => setEditing(p => ({ ...p, paymentMethod: e.target.value }))}>
                        <option value="">Not specified</option>
                        <option value={0}>💵 Cash</option>
                        <option value={1}>📱 Vodafone Cash</option>
                        <option value={2}>💳 InstaPay</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Payment Reference (optional)</label>
                      <input className="input" placeholder="Receipt or transfer number..." value={editing.paymentReference} onChange={e => setEditing(p => ({ ...p, paymentReference: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Remaining Sessions</label>
                      <input className="input" type="number" min="0" max="100" value={editing.remainingSessionsThisMonth} onChange={e => setEditing(p => ({ ...p, remainingSessionsThisMonth: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
