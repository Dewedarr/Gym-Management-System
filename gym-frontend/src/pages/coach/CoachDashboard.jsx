import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CoachDashboard() {
  const [profile, setProfile] = useState(null)
  const [slots, setSlots] = useState(null)
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/coach/profile'),
      api.get('/coach/available-trainees-slots'),
      api.get('/coach/trainees')
    ]).then(([p, s, t]) => {
      setProfile(p.data)
      setSlots(s.data)
      setTrainees(t.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">Welcome, {profile?.fullName} 👋</h1>
        <p className="text-gym-muted text-sm">{profile?.specialization || 'Certified Coach'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card glow">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👥</span>
            <p className="text-gym-muted text-sm">My trainees this month</p>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-black text-gym-text">{slots?.current}</p>
            <p className="text-gym-muted mb-1">/ {slots?.max}</p>
          </div>
          <div className="mt-3 bg-gym-bg rounded-full h-2">
            <div
              className="bg-gym-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((slots?.current || 0) / (slots?.max || 1)) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gym-muted mt-1">{slots?.available} slots available</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">💰</span>
            <p className="text-gym-muted text-sm">Private session price</p>
          </div>
          <p className="text-3xl font-black text-gym-gold">{profile?.privateSessionPrice} <span className="text-sm font-normal text-gym-muted">EGP</span></p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gym-text">Recent Trainees</h2>
          <Link to="/coach/trainees" className="text-gym-primary text-sm hover:underline">View All</Link>
        </div>
        {trainees.length === 0 ? (
          <p className="text-gym-muted text-center py-4">No trainees yet</p>
        ) : (
          <div className="space-y-3">
            {trainees.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-gym-bg rounded-lg">
                <div className="w-10 h-10 bg-gym-primary/20 rounded-xl flex items-center justify-center text-lg">🏃</div>
                <div>
                  <p className="font-semibold text-gym-text text-sm">{t.fullName}</p>
                  <p className="text-gym-muted text-xs">{t.fitnessGoal || 'No goal specified'}</p>
                </div>
                <span className="ml-auto text-xs text-gym-muted">{t.weight ? `${t.weight} kg` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
