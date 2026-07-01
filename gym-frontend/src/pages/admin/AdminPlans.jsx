import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Loader2, Edit2, Check, X, Trash2 } from 'lucide-react'

export default function AdminPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const fetch = () => api.get('/admin/subscription-plans').then(r => setPlans(r.data)).finally(() => setLoading(false))
  useEffect(() => { fetch() }, [])

  const deletePlan = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    try {
      await api.delete(`/admin/subscription-plans/${id}`)
      toast.success('Plan deleted')
      fetch()
    } catch { toast.error('An error occurred') }
  }

  const save = async () => {
    try {
      if (editing.id) {
        await api.put(`/admin/subscription-plans/${editing.id}`, editing)
        toast.success('Plan updated')
      } else {
        await api.post('/admin/subscription-plans', editing)
        toast.success('Plan created')
      }
      setEditing(null)
      fetch()
    } catch {
      toast.error('An error occurred')
    }
  }

  const typeColor = t => ({ Regular: 'bg-blue-500/20 text-blue-400', Premium: 'bg-gym-gold/20 text-gym-gold', PrivateCoaching: 'bg-gym-primary/20 text-gym-primary' })[t] || ''

  const emptyPlan = { name: '', type: 'Regular', price: 0, durationMonths: 1, sessionsPerMonth: 12, inBodySessionsPerMonth: 1, includesNutritionPlan: false, includesPrivateCoach: false, features: '' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gym-text">Plans</h1>
          <p className="text-gym-muted text-sm">{plans.length} plans</p>
        </div>
        <button onClick={() => setEditing(emptyPlan)} className="btn-primary">
          <Plus size={18} /> Add Plan
        </button>
      </div>

      {editing && (
        <div className="card glow">
          <h3 className="font-bold text-gym-text mb-4">{editing.id ? 'Edit Plan' : 'New Plan'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Plan Name</label><input className="input" value={editing.name} onChange={e => setEditing(p => ({...p, name: e.target.value}))} /></div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={editing.type} onChange={e => setEditing(p => ({...p, type: e.target.value}))}>
                <option value="Regular">Regular</option>
                <option value="Premium">Premium</option>
                <option value="PrivateCoaching">Private Coaching</option>
              </select>
            </div>
            <div><label className="label">Price (EGP)</label><input type="number" className="input" value={editing.price} onChange={e => setEditing(p => ({...p, price: +e.target.value}))} /></div>
            <div><label className="label">Duration (months)</label><input type="number" className="input" value={editing.durationMonths} onChange={e => setEditing(p => ({...p, durationMonths: +e.target.value}))} /></div>
            <div><label className="label">Sessions per month</label><input type="number" className="input" value={editing.sessionsPerMonth} onChange={e => setEditing(p => ({...p, sessionsPerMonth: +e.target.value}))} /></div>
            <div><label className="label">InBody sessions per month</label><input type="number" className="input" value={editing.inBodySessionsPerMonth} onChange={e => setEditing(p => ({...p, inBodySessionsPerMonth: +e.target.value}))} /></div>
            <div className="col-span-2"><label className="label">Features (separated by |)</label><input className="input" value={editing.features} onChange={e => setEditing(p => ({...p, features: e.target.value}))} placeholder="Feature 1|Feature 2|Feature 3" /></div>
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.includesNutritionPlan} onChange={e => setEditing(p => ({...p, includesNutritionPlan: e.target.checked}))} className="w-4 h-4 accent-gym-primary" />
                <span className="text-sm text-gym-text">Includes Nutrition Plan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.includesPrivateCoach} onChange={e => setEditing(p => ({...p, includesPrivateCoach: e.target.checked}))} className="w-4 h-4 accent-gym-primary" />
                <span className="text-sm text-gym-text">Includes Private Coach</span>
              </label>
            </div>
            <div className="col-span-2 flex gap-3">
              <button onClick={save} className="btn-primary flex-1"><Check size={16} /> Save</button>
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1"><X size={16} /> Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={30} className="animate-spin text-gym-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className="card hover:border-gym-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-black text-gym-text text-lg">{p.name}</h3>
                  <span className={`badge ${typeColor(p.type)}`}>{p.type}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing({...p})} className="p-1.5 rounded-lg hover:bg-white/10 text-gym-muted hover:text-white">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deletePlan(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gym-muted hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-3xl font-black text-gym-primary mb-4">{p.price} <span className="text-sm text-gym-muted font-normal">EGP / month</span></p>
              <div className="space-y-2">
                {p.features?.split('|').map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gym-text">
                    <span className="text-gym-green text-xs">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
