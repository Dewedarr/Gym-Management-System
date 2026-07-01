import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Loader2, Utensils, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import CoachNutritionForm from './CoachNutritionForm'
import toast from 'react-hot-toast'

export default function CoachNutrition() {
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)   // { trainee, editPlan? }
  const [plans, setPlans] = useState({})            // { [traineeId]: [...] }
  const [expanded, setExpanded] = useState({})      // { [traineeId]: bool }
  const [loadingPlans, setLoadingPlans] = useState({})

  useEffect(() => {
    api.get('/coach/trainees').then(r => setTrainees(r.data)).finally(() => setLoading(false))
  }, [])

  const loadPlans = async (traineeId) => {
    if (plans[traineeId]) return // already loaded
    setLoadingPlans(p => ({ ...p, [traineeId]: true }))
    try {
      const r = await api.get(`/coach/nutrition-plans/${traineeId}`)
      setPlans(p => ({ ...p, [traineeId]: r.data }))
    } catch { toast.error('Failed to load plans') }
    finally { setLoadingPlans(p => ({ ...p, [traineeId]: false })) }
  }

  const toggleExpand = (traineeId) => {
    const nowOpen = !expanded[traineeId]
    setExpanded(e => ({ ...e, [traineeId]: nowOpen }))
    if (nowOpen) loadPlans(traineeId)
  }

  const handleDelete = async (traineeId, planId) => {
    if (!confirm('Delete this nutrition plan?')) return
    try {
      await api.delete(`/coach/nutrition-plan/${planId}`)
      setPlans(p => ({ ...p, [traineeId]: p[traineeId].filter(x => x.id !== planId) }))
      toast.success('Plan deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleSaved = (traineeId) => {
    setSelected(null)
    // reload plans for this trainee
    setPlans(p => ({ ...p, [traineeId]: undefined }))
    if (expanded[traineeId]) loadPlans(traineeId)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">Nutrition Plans</h1>
        <p className="text-gym-muted text-sm">Click on a trainee to view or add nutrition plans</p>
      </div>

      {selected && (
        <CoachNutritionForm
          traineeId={selected.trainee.id}
          traineeName={selected.trainee.fullName}
          editPlan={selected.editPlan || null}
          onClose={() => setSelected(null)}
          onSaved={() => handleSaved(selected.trainee.id)}
        />
      )}

      <div className="space-y-3">
        {trainees.map(t => (
          <div key={t.id} className="card border border-gym-border">
            {/* Trainee row */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gym-primary/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏃</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gym-text">{t.fullName}</h3>
                <p className="text-gym-muted text-xs">{t.fitnessGoal || 'No goal specified'}</p>
              </div>
              <button
                onClick={() => setSelected({ trainee: t })}
                className="btn-primary py-2 px-3 text-sm flex-shrink-0 flex items-center gap-1"
              >
                <Plus size={15} /> New Plan
              </button>
              <button
                onClick={() => toggleExpand(t.id)}
                className="p-2 rounded-lg hover:bg-gym-bg text-gym-muted hover:text-gym-text transition-colors"
              >
                {expanded[t.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {/* Plans list */}
            {expanded[t.id] && (
              <div className="mt-4 border-t border-gym-border pt-4 space-y-2">
                {loadingPlans[t.id] ? (
                  <div className="flex justify-center py-4"><Loader2 size={24} className="animate-spin text-gym-primary" /></div>
                ) : !plans[t.id] || plans[t.id].length === 0 ? (
                  <p className="text-gym-muted text-sm text-center py-4">No nutrition plans yet</p>
                ) : (
                  plans[t.id].map(plan => (
                    <div key={plan.id} className="bg-gym-bg rounded-xl p-3 flex items-start gap-3">
                      <Utensils size={18} className="text-gym-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gym-text text-sm">{plan.title}</p>
                        {plan.description && <p className="text-gym-muted text-xs mt-0.5">{plan.description}</p>}
                        <p className="text-gym-muted text-xs mt-1">
                          {plan.meals?.length || 0} meals · {new Date(plan.createdAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setSelected({ trainee: t, editPlan: plan })}
                          className="p-1.5 rounded-lg hover:bg-gym-card text-gym-muted hover:text-gym-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, plan.id)}
                          className="p-1.5 rounded-lg hover:bg-gym-card text-gym-muted hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {trainees.length === 0 && (
          <div className="text-center py-12 text-gym-muted">
            <Utensils size={48} className="mx-auto mb-3 opacity-30" />
            <p>No trainees yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
