import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Loader2, Plus, Activity, X, ChevronDown, ChevronUp } from 'lucide-react'

const emptyForm = {
  weight: '', height: '', bodyFatPercentage: '', muscleMass: '',
  visceralFat: '', waterPercentage: '', boneMass: '', notes: ''
}

// baseUrl: e.g. '/admin/trainees/5/inbody' or '/coach/trainees/5/inbody'
export default function InBodyViewer({ traineeId, traineeName, baseUrl, onClose }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const load = () => {
    setLoading(true)
    api.get(baseUrl).then(r => setRecords(r.data)).catch(() => toast.error('Failed to load records')).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [baseUrl])

  const submit = async e => {
    e.preventDefault()
    if (!form.weight || !form.height) { toast.error('Weight and height are required'); return }
    setSaving(true)
    try {
      await api.post(baseUrl, {
        weight: +form.weight, height: +form.height,
        bodyFatPercentage: form.bodyFatPercentage ? +form.bodyFatPercentage : null,
        muscleMass: form.muscleMass ? +form.muscleMass : null,
        visceralFat: form.visceralFat ? +form.visceralFat : null,
        waterPercentage: form.waterPercentage ? +form.waterPercentage : null,
        boneMass: form.boneMass ? +form.boneMass : null,
        notes: form.notes || null
      })
      toast.success('Measurement added ✅')
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch { toast.error('An error occurred') }
    finally { setSaving(false) }
  }

  const fields = [
    { key: 'weight', label: 'Weight (kg)', required: true },
    { key: 'height', label: 'Height (cm)', required: true },
    { key: 'bodyFatPercentage', label: 'Body Fat %' },
    { key: 'muscleMass', label: 'Muscle Mass (kg)' },
    { key: 'visceralFat', label: 'Visceral Fat' },
    { key: 'waterPercentage', label: 'Water %' },
    { key: 'boneMass', label: 'Bone Mass (kg)' },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4" dir="ltr">
      <div className="bg-gym-card border border-gym-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gym-card border-b border-gym-border p-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-black text-gym-text flex items-center gap-2">
              <Activity size={20} className="text-gym-primary" /> InBody — {traineeName}
            </h2>
            <p className="text-gym-muted text-xs mt-0.5">{records.length} records</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(s => !s)} className="btn-primary py-2 px-3 text-sm flex items-center gap-1">
              <Plus size={15} /> New Record
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gym-bg text-gym-muted">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Add Form */}
          {showForm && (
            <div className="bg-gym-bg border border-gym-border rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-gym-text text-sm">Add New Measurement</h3>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fields.map(f => (
                    <div key={f.key}>
                      <label className="label text-xs">{f.label}{f.required && ' *'}</label>
                      <input
                        type="number" step="0.1" className="input text-sm"
                        value={form[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        required={f.required}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="label text-xs">Notes</label>
                  <textarea className="input text-sm" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-2 text-sm disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Record'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Records */}
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={28} className="animate-spin text-gym-primary" /></div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gym-muted">
              <Activity size={40} className="mx-auto mb-3 opacity-30" />
              <p>No records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r, i) => (
                <div key={r.id} className="bg-gym-bg border border-gym-border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  >
                    <div className="w-9 h-9 bg-gym-primary/20 rounded-lg flex items-center justify-center text-gym-primary font-black text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gym-text text-sm">{r.weight} kg</span>
                        {r.bmi > 0 && <span className="badge bg-gym-primary/20 text-gym-primary text-xs">BMI {r.bmi}</span>}
                        {r.bodyFatPercentage && <span className="badge bg-orange-500/20 text-orange-400 text-xs">Fat {r.bodyFatPercentage}%</span>}
                        {r.muscleMass && <span className="badge bg-blue-500/20 text-blue-400 text-xs">Muscle {r.muscleMass} kg</span>}
                      </div>
                      <p className="text-gym-muted text-xs mt-0.5">{new Date(r.recordDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    {expanded === r.id ? <ChevronUp size={16} className="text-gym-muted flex-shrink-0" /> : <ChevronDown size={16} className="text-gym-muted flex-shrink-0" />}
                  </button>

                  {expanded === r.id && (
                    <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-gym-border pt-3">
                      {[
                        ['Weight', r.weight, 'kg'],
                        ['Height', r.height, 'cm'],
                        ['BMI', r.bmi, ''],
                        ['Body Fat', r.bodyFatPercentage, '%'],
                        ['Muscle Mass', r.muscleMass, 'kg'],
                        ['Visceral Fat', r.visceralFat, ''],
                        ['Water %', r.waterPercentage, '%'],
                        ['Bone Mass', r.boneMass, 'kg'],
                      ].filter(([, v]) => v != null && v !== 0).map(([label, val, unit]) => (
                        <div key={label} className="bg-gym-card rounded-lg p-2 text-center">
                          <div className="text-gym-primary font-black text-sm">{val} {unit}</div>
                          <div className="text-gym-muted text-xs">{label}</div>
                        </div>
                      ))}
                      {r.notes && (
                        <div className="col-span-full bg-gym-card rounded-lg p-2">
                          <p className="text-gym-muted text-xs">📝 {r.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
