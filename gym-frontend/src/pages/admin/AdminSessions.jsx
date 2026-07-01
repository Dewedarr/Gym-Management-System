import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle, XCircle, Clock, ClipboardList, Trash2, RotateCcw } from 'lucide-react'

const RATINGS = { 5: '🔥 Excellent', 4: '💪 Very Good', 3: '👍 Good', 2: '😐 Fair', 1: '😔 Poor' }

const STATUS_LABELS = {
  0: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-400/15' },
  1: { label: 'Confirmed', color: 'text-gym-green', bg: 'bg-gym-green/15' },
  2: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-400/15' },
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [acting, setActing] = useState(null)

  const load = (f = filter) => {
    setLoading(true)
    api.get(`/admin/coaching-sessions?status=${f}`)
      .then(r => setSessions(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const confirm = async (id) => {
    setActing(id + '-confirm')
    try {
      const r = await api.put(`/admin/coaching-sessions/${id}/confirm`)
      toast.success(r.data.message)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally { setActing(null) }
  }

  const cancel = async (id) => {
    if (!window.confirm('Cancel this session? It will not count as a trial session.')) return
    setActing(id + '-cancel')
    try {
      const r = await api.put(`/admin/coaching-sessions/${id}/cancel`)
      toast.success(r.data.message)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally { setActing(null) }
  }

  const setStatus = async (id, status) => {
    const labels = { 0: 'Pending', 1: 'Confirmed', 2: 'Cancelled' }
    if (!window.confirm(`Change session status to "${labels[status]}"?`)) return
    setActing(id + '-status')
    try {
      const r = await api.put(`/admin/coaching-sessions/${id}/set-status`, { status })
      toast.success(r.data.message)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally { setActing(null) }
  }

  const deleteSession = async (id) => {
    if (!window.confirm('Permanently delete this session?')) return
    setActing(id + '-delete')
    try {
      await api.delete(`/admin/coaching-sessions/${id}`)
      toast.success('Session deleted ✅')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally { setActing(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gym-text">Coaching Sessions</h1>
          <p className="text-gym-muted text-sm">Review and confirm trainee attendance</p>
        </div>
        {filter === 'pending' && sessions.length > 0 && (
          <div className="badge bg-yellow-400/20 text-yellow-400 text-sm font-bold px-3 py-1.5">
            <Clock size={14} /> {sessions.length} pending
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {[
          ['pending', 'Pending', 'text-yellow-400'],
          ['confirmed', 'Confirmed', 'text-gym-green'],
          ['cancelled', 'Cancelled', 'text-red-400'],
          ['', 'All', 'text-gym-muted'],
        ].map(([val, label, color]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === val ? 'bg-gym-primary text-white' : `bg-gym-card border border-gym-border ${color} hover:border-gym-primary/40`}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={36} className="animate-spin text-gym-primary" /></div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList size={48} className="mx-auto mb-3 text-gym-primary opacity-30" />
          <p className="text-gym-muted">No sessions {filter === 'pending' ? 'pending confirmation' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => {
            const st = STATUS_LABELS[s.status]
            const dateStr = new Date(s.sessionDate).toLocaleDateString('en-GB', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })
            const timeStr = new Date(s.sessionDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

            return (
              <div key={s.id} className={`card border-l-4 ${s.status === 0 ? 'border-l-yellow-400' : s.status === 1 ? 'border-l-gym-green' : 'border-l-red-400'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge text-xs font-bold ${st.bg} ${st.color}`}>{st.label}</span>
                      <span className="text-gym-muted text-xs">#{s.id}</span>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <p className="text-xs text-gym-muted">Trainee</p>
                        <p className="font-bold text-gym-text">{s.traineeName}</p>
                        <p className="text-xs text-gym-muted mt-0.5">
                          Trial sessions: <span className={`font-bold ${s.trialSessionsUsed >= 2 ? 'text-red-400' : 'text-gym-green'}`}>{s.trialSessionsUsed}/2</span>
                        </p>
                      </div>
                      <div className="w-px h-10 bg-gym-border hidden sm:block" />
                      <div>
                        <p className="text-xs text-gym-muted">Coach</p>
                        <p className="font-bold text-gym-text">{s.coachName}</p>
                      </div>
                      <div className="w-px h-10 bg-gym-border hidden sm:block" />
                      <div>
                        <p className="text-xs text-gym-muted">Date</p>
                        <p className="font-semibold text-gym-text text-sm">{dateStr}</p>
                        <p className="text-xs text-gym-muted">{timeStr}</p>
                      </div>
                    </div>

                    {s.rating && <span className="text-gym-muted text-sm">{RATINGS[s.rating] || ''}</span>}

                    {s.notes && (
                      <div className="bg-gym-bg rounded-lg px-3 py-2 text-sm text-gym-text">
                        📝 {s.notes}
                      </div>
                    )}

                    {s.status !== 0 && s.confirmedAt && (
                      <p className="text-xs text-gym-muted">
                        {s.status === 1 ? '✅ Confirmed' : '❌ Cancelled'} on {new Date(s.confirmedAt).toLocaleDateString('en-GB')}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {s.status === 0 && (<>
                      <button onClick={() => confirm(s.id)} disabled={!!acting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gym-green/20 text-gym-green hover:bg-gym-green/30 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                        {acting === s.id + '-confirm' ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Confirm
                      </button>
                      <button onClick={() => cancel(s.id)} disabled={!!acting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                        {acting === s.id + '-cancel' ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Cancel
                      </button>
                    </>)}

                    {s.status === 1 && (<>
                      <button onClick={() => setStatus(s.id, 2)} disabled={!!acting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                        <XCircle size={15} /> Cancel
                      </button>
                      <button onClick={() => setStatus(s.id, 0)} disabled={!!acting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                        <RotateCcw size={15} /> Reset
                      </button>
                    </>)}

                    {s.status === 2 && (<>
                      <button onClick={() => setStatus(s.id, 1)} disabled={!!acting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gym-green/20 text-gym-green hover:bg-gym-green/30 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                        <CheckCircle size={15} /> Confirm
                      </button>
                      <button onClick={() => setStatus(s.id, 0)} disabled={!!acting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                        <RotateCcw size={15} /> Reset
                      </button>
                    </>)}

                    <button onClick={() => deleteSession(s.id)} disabled={!!acting}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                      {acting === s.id + '-delete' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
