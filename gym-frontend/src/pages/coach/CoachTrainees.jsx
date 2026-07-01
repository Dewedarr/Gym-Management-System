import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, ChevronDown, ChevronUp, Dumbbell, Utensils } from 'lucide-react'
import CoachNutritionForm from './CoachNutritionForm'

export default function CoachTrainees() {
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [detail, setDetail] = useState(null)
  const [showNutrition, setShowNutrition] = useState(null)

  useEffect(() => {
    api.get('/coach/trainees').then(r => setTrainees(r.data)).finally(() => setLoading(false))
  }, [])

  const loadDetail = async (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    const r = await api.get(`/coach/trainees/${id}`)
    setDetail(r.data)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">My Trainees</h1>
        <p className="text-gym-muted text-sm">{trainees.length} trainees</p>
      </div>

      {showNutrition && (
        <CoachNutritionForm
          traineeId={showNutrition}
          traineeName={trainees.find(t => t.id === showNutrition)?.fullName}
          onClose={() => setShowNutrition(null)}
          onSaved={() => { setShowNutrition(null); toast.success('Nutrition plan saved') }}
        />
      )}

      {trainees.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-6xl mb-4">👥</p>
          <p className="text-gym-muted">No trainees yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trainees.map(t => (
            <div key={t.id} className="card p-0 overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => loadDetail(t.id)}
              >
                <div className="w-12 h-12 bg-gym-primary/20 rounded-xl flex items-center justify-center text-2xl">🏃</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gym-text">{t.fullName}</h3>
                    {t.trainingStatus === 'Completed' && (
                      <span className="badge bg-blue-500/20 text-blue-400 text-xs">🎓 Completed</span>
                    )}
                    {t.trainingStatus === 'Paused' && (
                      <span className="badge bg-yellow-500/20 text-yellow-400 text-xs">⏸ Paused</span>
                    )}
                  </div>
                  <p className="text-gym-muted text-xs truncate">{t.email}</p>
                  {t.phone && <p className="text-gym-muted text-xs">📞 {t.phone}</p>}
                </div>
                <div className="flex items-center gap-4">
                  {t.weight && <span className="text-gym-muted text-sm">{t.weight} kg</span>}
                  {t.height && <span className="text-gym-muted text-sm">{t.height} cm</span>}
                  {expanded === t.id ? <ChevronUp size={18} className="text-gym-muted" /> : <ChevronDown size={18} className="text-gym-muted" />}
                </div>
              </div>

              {expanded === t.id && detail && detail.id === t.id && (
                <div className="border-t border-gym-border p-4 bg-gym-bg space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      ['Height', detail.height ? `${detail.height} cm` : '-'],
                      ['Weight', detail.weight ? `${detail.weight} kg` : '-'],
                      ['Goal', detail.fitnessGoal || '-'],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-gym-card rounded-lg p-3 text-center">
                        <p className="text-gym-muted text-xs">{k}</p>
                        <p className="text-gym-text font-bold mt-1">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <AssignExerciseBtn traineeId={t.id} />
                    <button onClick={() => setShowNutrition(t.id)} className="btn-secondary flex-1">
                      <Utensils size={16} /> Nutrition Plan
                    </button>
                  </div>

                  {detail.inBodyRecords?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gym-text mb-2">Latest InBody</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          ['Weight', `${detail.inBodyRecords[0].weight} kg`],
                          ['BMI', detail.inBodyRecords[0].bmi?.toFixed(1)],
                          ['Body Fat', `${detail.inBodyRecords[0].bodyFatPercentage?.toFixed(1)}%`],
                          ['Muscle Mass', detail.inBodyRecords[0].muscleMass ? `${detail.inBodyRecords[0].muscleMass} kg` : '-'],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-gym-card rounded-lg p-2 text-center">
                            <p className="text-gym-muted text-xs">{k}</p>
                            <p className="text-gym-primary font-bold text-sm">{v || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AssignExerciseBtn({ traineeId }) {
  const [exercises, setExercises] = useState([])
  const [show, setShow] = useState(false)
  const [selected, setSelected] = useState('')
  const [day, setDay] = useState('')

  const load = async () => {
    if (!show) {
      const r = await api.get('/coach/exercises')
      setExercises(r.data)
    }
    setShow(s => !s)
  }

  const assign = async () => {
    if (!selected) return
    await api.post('/coach/assign-exercise', { traineeId, exerciseId: +selected, day })
    toast.success('Exercise assigned')
    setShow(false)
  }

  return (
    <div className="flex-1 space-y-2">
      <button onClick={load} className="btn-primary w-full"><Dumbbell size={16} /> Assign Exercise</button>
      {show && (
        <div className="bg-gym-card rounded-lg p-3 space-y-2">
          <select className="input" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Select exercise</option>
            {exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input className="input" placeholder="Day (e.g. Monday)" value={day} onChange={e => setDay(e.target.value)} />
          <button onClick={assign} className="btn-primary w-full">Confirm</button>
        </div>
      )}
    </div>
  )
}
