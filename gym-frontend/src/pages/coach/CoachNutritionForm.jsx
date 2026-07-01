import { useState, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, Upload, FileText, Image } from 'lucide-react'

const emptyMeal = { mealName: '', time: '', foods: '', calories: '', protein: '', carbs: '', fats: '' }

export default function CoachNutritionForm({ traineeId, traineeName, editPlan, onClose, onSaved }) {
  const isEdit = !!editPlan
  const [form, setForm] = useState(() => isEdit
    ? { title: editPlan.title || '', description: editPlan.description || '', meals: editPlan.meals?.length ? editPlan.meals : [{ ...emptyMeal }] }
    : { title: '', description: '', meals: [{ ...emptyMeal }] }
  )
  const [attachment, setAttachment] = useState(
    isEdit && editPlan.attachmentBase64 ? { base64: editPlan.attachmentBase64, type: editPlan.attachmentType || 'image', name: 'Current File' } : null
  )
  const fileRef = useRef()

  const addMeal = () => setForm(f => ({ ...f, meals: [...f.meals, { ...emptyMeal }] }))
  const removeMeal = i => setForm(f => ({ ...f, meals: f.meals.filter((_, idx) => idx !== i) }))
  const updateMeal = (i, field, val) => setForm(f => ({
    ...f, meals: f.meals.map((m, idx) => idx === i ? { ...m, [field]: val } : m)
  }))

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5_000_000) { toast.error('File too large (max 5MB)'); return }

    const ext = file.name.split('.').pop().toLowerCase()
    let type = 'image'
    if (['pdf'].includes(ext)) type = 'pdf'
    else if (['doc', 'docx'].includes(ext)) type = 'word'

    const reader = new FileReader()
    reader.onload = (ev) => setAttachment({ base64: ev.target.result, type, name: file.name })
    reader.readAsDataURL(file)
  }

  const submit = async e => {
    e.preventDefault()
    const payload = {
      traineeId,
      title: form.title,
      description: form.description,
      attachmentBase64: attachment?.base64 || null,
      attachmentType: attachment?.type || null,
      meals: form.meals.map(m => ({
        ...m,
        calories: m.calories ? +m.calories : null,
        protein: m.protein ? +m.protein : null,
        carbs: m.carbs ? +m.carbs : null,
        fats: m.fats ? +m.fats : null
      }))
    }
    try {
      if (isEdit) {
        await api.put(`/coach/nutrition-plan/${editPlan.id}`, payload)
        toast.success('Plan updated ✅')
      } else {
        await api.post('/coach/nutrition-plan', payload)
        toast.success('Nutrition plan saved ✅')
      }
      onSaved()
    } catch {
      toast.error('An error occurred')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4" dir="ltr">
      <div className="bg-gym-card border border-gym-border rounded-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gym-card border-b border-gym-border p-4 flex items-center justify-between z-10">
          <h2 className="font-black text-gym-text">{isEdit ? 'Edit Plan' : 'Nutrition Plan'} for {traineeName}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gym-bg text-gym-muted"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="label">Plan Title *</label>
            <input className="input" required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Muscle Building Plan - March 2024" />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          </div>

          {/* File Upload */}
          <div className="border border-gym-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gym-text text-sm">📎 Attach Diet File (optional)</p>
              <span className="text-gym-muted text-xs">Image / PDF / Word • Max 5MB</span>
            </div>

            {!attachment ? (
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="w-full border-2 border-dashed border-gym-border hover:border-gym-primary rounded-xl p-6 flex flex-col items-center gap-2 transition-colors text-gym-muted hover:text-gym-primary"
              >
                <Upload size={28} />
                <span className="text-sm font-semibold">Click to upload file</span>
                <span className="text-xs">JPG, PNG, PDF, DOC, DOCX</span>
              </button>
            ) : (
              <div className="relative">
                {attachment.type === 'image' ? (
                  <img src={attachment.base64} alt="preview" className="w-full rounded-xl object-contain max-h-64" />
                ) : (
                  <div className="flex items-center gap-3 bg-gym-bg rounded-xl p-4">
                    {attachment.type === 'pdf' ? <FileText size={32} className="text-red-400" /> : <FileText size={32} className="text-blue-400" />}
                    <div>
                      <p className="font-semibold text-gym-text text-sm">{attachment.name}</p>
                      <p className="text-gym-muted text-xs">{attachment.type.toUpperCase()}</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setAttachment(null); fileRef.current.value = '' }}
                  className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFile} />
          </div>

          {/* Meals */}
          <div className="border-t border-gym-border pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gym-text">Meals</h3>
              <button type="button" onClick={addMeal} className="btn-secondary text-sm py-1.5">
                <Plus size={16} />Add Meal
              </button>
            </div>

            {form.meals.map((meal, i) => (
              <div key={i} className="bg-gym-bg rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gym-primary">Meal {i + 1}</h4>
                  {form.meals.length > 1 && (
                    <button type="button" onClick={() => removeMeal(i)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="label">Meal Name *</label><input className="input" required value={meal.mealName} onChange={e => updateMeal(i, 'mealName', e.target.value)} placeholder="Breakfast / Lunch / Dinner..." /></div>
                  <div><label className="label">Time</label><input className="input" value={meal.time} onChange={e => updateMeal(i, 'time', e.target.value)} placeholder="8:00 AM" /></div>
                </div>
                <div><label className="label">Foods</label><textarea className="input" rows={2} value={meal.foods} onChange={e => updateMeal(i, 'foods', e.target.value)} placeholder="3 boiled eggs, 2 toast slices..." /></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['calories', 'protein', 'carbs', 'fats'].map(f => (
                    <div key={f}>
                      <label className="label text-xs">{{ calories: 'Calories', protein: 'Protein (g)', carbs: 'Carbs (g)', fats: 'Fats (g)' }[f]}</label>
                      <input type="number" className="input text-sm" value={meal[f]} onChange={e => updateMeal(i, f, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{isEdit ? 'Save Changes' : 'Save Plan'}</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
