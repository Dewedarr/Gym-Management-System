import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle, XCircle, Plus } from 'lucide-react'

export default function AdminPayments() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [trainees, setTrainees] = useState([])
  const [plans, setPlans] = useState([])
  const [manualForm, setManualForm] = useState({ userId: '', planId: '' })

  const fetchPending = () =>
    api.get('/payment/pending').then(r => setPending(r.data)).finally(() => setLoading(false))

  useEffect(() => {
    fetchPending()
    api.get('/admin/users', { params: { role: 'Trainee' } }).then(r => setTrainees(r.data))
    api.get('/admin/subscription-plans').then(r => setPlans(r.data))
  }, [])

  const confirm = async (id, approve) => {
    setConfirming(id)
    try {
      await api.post('/payment/confirm', { subscriptionId: id, isApproved: approve })
      toast.success(approve ? 'Payment confirmed and subscription activated ✅' : 'Payment rejected')
      fetchPending()
    } catch { toast.error('An error occurred') }
    finally { setConfirming(null) }
  }

  const addManual = async e => {
    e.preventDefault()
    if (!manualForm.userId || !manualForm.planId) { toast.error('Please select a trainee and a plan'); return }
    try {
      await api.post('/payment/manual-confirm', { userId: +manualForm.userId, planId: +manualForm.planId })
      toast.success('Payment recorded and subscription activated')
      setShowManual(false)
      setManualForm({ userId: '', planId: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'An error occurred') }
  }

  const methodLabel = m => ({ VodafoneCash: '📱 Vodafone Cash', InstaPay: '💳 InstaPay', Cash: '💵 Cash' })[m] || m

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gym-text">Payments</h1>
          <p className="text-gym-muted text-sm">{pending.length} pending payments</p>
        </div>
        <button onClick={() => setShowManual(s => !s)} className="btn-primary">
          <Plus size={16} /> Manual Payment
        </button>
      </div>

      {showManual && (
        <div className="card glow">
          <h3 className="font-bold text-gym-text mb-4">Manual Payment (Cash at Reception)</h3>
          <form onSubmit={addManual} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Trainee *</label>
              <select className="input" value={manualForm.userId} onChange={e => setManualForm(f => ({ ...f, userId: e.target.value }))}>
                <option value="">Select trainee</option>
                {trainees.map(t => <option key={t.id} value={t.id}>{t.fullName} — {t.email}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Plan *</label>
              <select className="input" value={manualForm.planId} onChange={e => setManualForm(f => ({ ...f, planId: e.target.value }))}>
                <option value="">Select plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price} EGP</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex-1">Activate Subscription</button>
              <button type="button" onClick={() => setShowManual(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={30} className="animate-spin text-gym-primary" /></div>
      ) : pending.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gym-muted">No pending payments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(p => (
            <div key={p.id} className="card border-yellow-500/30 bg-yellow-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">⏳</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gym-text">{p.traineeName}</h3>
                    {p.traineePhone && <span className="text-gym-muted text-xs">📞 {p.traineePhone}</span>}
                  </div>
                  <p className="text-gym-muted text-sm">{p.planName}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="badge bg-yellow-500/20 text-yellow-400">{methodLabel(p.paymentMethod)}</span>
                    <span className="text-gym-gold font-bold text-sm">{p.paidAmount} EGP</span>
                    {p.paymentReference && (
                      <span className="text-gym-muted text-xs">Ref: {p.paymentReference}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => confirm(p.id, true)} disabled={confirming === p.id}
                    className="flex items-center gap-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 font-bold text-sm px-3 py-2 rounded-lg transition-colors">
                    {confirming === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                    Approve
                  </button>
                  <button onClick={() => confirm(p.id, false)} disabled={confirming === p.id}
                    className="flex items-center gap-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold text-sm px-3 py-2 rounded-lg transition-colors">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
