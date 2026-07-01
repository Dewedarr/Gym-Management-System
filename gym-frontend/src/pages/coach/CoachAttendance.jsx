import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle, Clock, Star, CalendarCheck, History } from 'lucide-react'

const RATINGS = [
  { value: 5, label: 'Excellent', emoji: '🔥' },
  { value: 4, label: 'Very Good', emoji: '💪' },
  { value: 3, label: 'Good', emoji: '👍' },
  { value: 2, label: 'Fair', emoji: '😐' },
  { value: 1, label: 'Poor', emoji: '😔' },
]

export default function CoachAttendance() {
  const [trainees, setTrainees] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('mark') // 'mark' | 'history'

  // Form state
  const [form, setForm] = useState({
    traineeId: '',
    sessionDate: new Date().toLocaleDateString('en-CA'),
    rating: 5,
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/coach/trainees'),
      api.get('/coach/sessions')
    ]).then(([t, s]) => {
      setTrainees(t.data)
      setSessions(s.data)
    }).finally(() => setLoading(false))
  }, [])

  const refreshSessions = () => api.get('/coach/sessions').then(r => setSessions(r.data))

  const submit = async e => {
    e.preventDefault()
    if (!form.traineeId) { toast.error('Please select a trainee'); return }
    setSubmitting(true)
    try {
      await api.post('/coach/sessions/mark', {
        traineeId: +form.traineeId,
        sessionDate: form.sessionDate,
        rating: form.rating,
        notes: form.notes || null
      })
      toast.success('✅ Attendance recorded — pending admin confirmation')
      setForm(f => ({ ...f, traineeId: '', notes: '', rating: 5 }))
      refreshSessions()
      setActiveTab('history')
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS = {
    0: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-400/15', icon: <Clock size={13} /> },
    1: { label: 'Confirmed ✅', color: 'text-gym-green', bg: 'bg-gym-green/15', icon: <CheckCircle size={13} /> },
    2: { label: 'Cancelled ❌', color: 'text-red-400', bg: 'bg-red-400/15', icon: null },
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">Attendance</h1>
        <p className="text-gym-muted text-sm">Record attendance for each training session</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('mark')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeTab === 'mark' ? 'bg-gym-primary text-white' : 'bg-gym-card border border-gym-border text-gym-muted hover:text-gym-text'}`}
        >
          <CalendarCheck size={16} />Mark Session
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeTab === 'history' ? 'bg-gym-primary text-white' : 'bg-gym-card border border-gym-border text-gym-muted hover:text-gym-text'}`}
        >
          <History size={16} />History
          {sessions.filter(s => s.status === 0).length > 0 && (
            <span className="bg-yellow-400 text-black text-xs font-black rounded-full px-1.5 py-0.5 leading-none">
              {sessions.filter(s => s.status === 0).length}
            </span>
          )}
        </button>
      </div>

      {/* Mark Attendance Form */}
      {activeTab === 'mark' && (
        <div className="card">
          <h2 className="font-bold text-gym-text text-lg mb-5">📋 Session Details</h2>
          <form onSubmit={submit} className="space-y-5">

            {/* Trainee selector */}
            <div>
              <label className="label">Trainee *</label>
              {trainees.length === 0 ? (
                <p className="text-gym-muted text-sm">No trainees yet</p>
              ) : (
                <div className="relative">
                  <select
                    className="input appearance-none cursor-pointer"
                    value={form.traineeId}
                    onChange={e => setForm(f => ({ ...f, traineeId: e.target.value }))}
                  >
                    <option value="">— Select Trainee —</option>
                    {trainees.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} {t.fitnessGoal ? `· ${t.fitnessGoal}` : ''}
                      </option>
                    ))}
                  </select>
                  {/* Preview card for selected trainee */}
                  {form.traineeId && (() => {
                    const t = trainees.find(x => x.id === +form.traineeId)
                    if (!t) return null
                    return (
                      <div className="mt-2 flex items-center gap-3 bg-gym-bg rounded-xl px-4 py-3 border border-gym-primary/30">
                        <div className="w-10 h-10 rounded-xl bg-gym-primary/20 flex items-center justify-center text-lg flex-shrink-0">🏃</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gym-text text-sm">{t.fullName}</p>
                          <p className="text-gym-muted text-xs">{t.fitnessGoal || 'No goal specified'} {t.weight ? `· ${t.weight} kg` : ''}</p>
                        </div>
                        <CheckCircle size={18} className="text-gym-primary flex-shrink-0" />
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="label">Session Date *</label>
              <input
                type="date"
                className="input"
                value={form.sessionDate}
                max={new Date().toLocaleDateString('en-CA')}
                onChange={e => setForm(f => ({ ...f, sessionDate: e.target.value }))}
                dir="ltr"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="label">Performance Rating</label>
              <div className="flex gap-2 flex-wrap">
                {RATINGS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, rating: r.value }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${form.rating === r.value ? 'bg-gym-primary border-gym-primary text-white' : 'border-gym-border text-gym-muted hover:border-gym-primary/40'}`}
                  >
                    <span>{r.emoji}</span>{r.label}
                    {form.rating === r.value && <Star size={13} fill="currentColor" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="e.g. Excellent performance, completed all exercises, needs improvement in..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <button type="submit" disabled={submitting || !form.traineeId} className="btn-primary w-full py-3">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CalendarCheck size={18} />}
              {submitting ? 'Recording...' : 'Mark Attendance'}
            </button>
          </form>
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="card text-center py-16">
              <History size={48} className="mx-auto mb-3 text-gym-primary opacity-30" />
              <p className="text-gym-muted">No sessions recorded yet</p>
            </div>
          ) : (
            sessions.map(s => {
              const st = STATUS[s.status]
              const ratingObj = RATINGS.find(r => r.value === s.rating)
              return (
                <div key={s.id} className={`card border-l-4 ${s.status === 0 ? 'border-l-yellow-400' : s.status === 1 ? 'border-l-gym-green' : 'border-l-red-400'}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge text-xs font-bold ${st.bg} ${st.color} flex items-center gap-1`}>
                          {st.icon}{st.label}
                        </span>
                        <span className="font-bold text-gym-text">{s.traineeName}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="text-gym-muted">
                          📅 {new Date(s.sessionDate || s.markedAt).toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        {ratingObj && (
                          <span className="text-gym-muted">{ratingObj.emoji} {ratingObj.label}</span>
                        )}
                      </div>

                      {s.notes && (
                        <p className="text-gym-muted text-sm bg-gym-bg rounded-lg px-3 py-2">📝 {s.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
