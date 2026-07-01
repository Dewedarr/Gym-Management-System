import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Loader2, Activity } from 'lucide-react'
import InBodyViewer from '../../components/InBodyViewer'

export default function CoachInBody() {
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/coach/trainees').then(r => setTrainees(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">InBody Measurements</h1>
        <p className="text-gym-muted text-sm">Click on a trainee to view or add measurements</p>
      </div>

      {selected && (
        <InBodyViewer
          traineeId={selected.id}
          traineeName={selected.fullName}
          baseUrl={`/coach/trainees/${selected.id}/inbody`}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="space-y-3">
        {trainees.map(t => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className="card w-full text-left hover:border-gym-primary/40 transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-gym-primary/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-gym-primary/30 transition-colors">
              🏃
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gym-text">{t.fullName}</h3>
              <p className="text-gym-muted text-xs">{t.fitnessGoal || 'No goal specified'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {t.weight && <span className="badge bg-gym-bg text-gym-muted text-xs">{t.weight} kg</span>}
              <span className="badge bg-gym-primary/20 text-gym-primary text-xs flex items-center gap-1">
                <Activity size={11} /> InBody
              </span>
            </div>
          </button>
        ))}
        {trainees.length === 0 && (
          <div className="text-center py-12 text-gym-muted">
            <Activity size={48} className="mx-auto mb-3 opacity-30" />
            <p>No trainees yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
