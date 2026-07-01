import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Loader2, Search } from 'lucide-react'

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/coaches').then(r => setCoaches(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = coaches.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (c.specialization || '').toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gym-text">Coaches</h1>
          <p className="text-gym-muted text-sm">{coaches.length} coaches</p>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
        <input className="input pl-9" placeholder="Search by name or specialization..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={30} className="animate-spin text-gym-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gym-muted">No coaches found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const fillPct = Math.round((c.traineesCount / (c.maxPrivateTraineesPerMonth || 1)) * 100)
            const isFull = c.traineesCount >= c.maxPrivateTraineesPerMonth
            return (
              <div key={c.id} className="card hover:border-gym-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🎯</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gym-text">{c.fullName}</h3>
                      <span className={`badge text-xs ${c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gym-muted text-xs">{c.specialization || 'General Fitness'} · {c.email}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gym-bg rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : fillPct > 70 ? 'bg-yellow-400' : 'bg-gym-green'}`}
                          style={{ width: `${Math.min(100, fillPct)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ${isFull ? 'text-red-400' : 'text-gym-muted'}`}>
                        {c.traineesCount}/{c.maxPrivateTraineesPerMonth} trainees
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-gym-gold font-black text-lg">{c.privateSessionPrice}</p>
                    <p className="text-gym-muted text-xs">EGP / session</p>
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
