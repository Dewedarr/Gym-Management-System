import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Loader2, Activity, Search } from 'lucide-react'
import InBodyViewer from '../../components/InBodyViewer'

export default function AdminInBody() {
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/admin/trainees').then(r => setTrainees(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = trainees.filter(t =>
    t.fullName?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">InBody Measurements</h1>
        <p className="text-gym-muted text-sm">Click on any trainee to view or add measurements</p>
      </div>

      {selected && (
        <InBodyViewer
          traineeId={selected.id}
          traineeName={selected.fullName}
          baseUrl={`/admin/trainees/${selected.id}/inbody`}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
        <input
          className="input pl-9"
          placeholder="Search trainee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(t => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className="card text-left hover:border-gym-primary/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gym-primary/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-gym-primary/30 transition-colors">
                🏃
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gym-text truncate">{t.fullName}</h3>
                {t.coachName && <p className="text-gym-muted text-xs truncate">Coach: {t.coachName}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge text-xs ${t.inBodyCount > 0 ? 'bg-gym-primary/20 text-gym-primary' : 'bg-gym-bg text-gym-muted'}`}>
                    <Activity size={10} className="inline mr-1" />
                    {t.inBodyCount} records
                  </span>
                  {t.weight && <span className="badge bg-gym-bg text-gym-muted text-xs">{t.weight} kg</span>}
                </div>
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gym-muted">
            <Activity size={40} className="mx-auto mb-3 opacity-30" />
            <p>No trainees found</p>
          </div>
        )}
      </div>
    </div>
  )
}
