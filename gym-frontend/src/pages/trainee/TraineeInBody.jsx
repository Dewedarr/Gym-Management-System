import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, Plus, Activity, Paperclip, X, FileText, Image, Pencil, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const emptyForm = {
  weight: '', height: '', bodyFatPercentage: '', muscleMass: '',
  visceralFat: '', waterPercentage: '', boneMass: '', notes: '',
  attachmentBase64: null, attachmentType: null, attachmentName: ''
}

export default function TraineeInBody() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [tab, setTab] = useState('manual')
  const [editId, setEditId] = useState(null)   // null = add, number = edit
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const fetchRecords = () => api.get('/trainee/inbody').then(r => setRecords(r.data)).finally(() => setLoading(false))
  useEffect(() => { fetchRecords() }, [])

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setTab('manual')
    setShowForm(true)
  }

  const openEdit = (r) => {
    setEditId(r.id)
    setForm({
      weight: r.weight || '',
      height: r.height || '',
      bodyFatPercentage: r.bodyFatPercentage ?? '',
      muscleMass: r.muscleMass ?? '',
      visceralFat: r.visceralFat ?? '',
      waterPercentage: r.waterPercentage ?? '',
      boneMass: r.boneMass ?? '',
      notes: r.notes || '',
      attachmentBase64: r.attachmentBase64 || null,
      attachmentType: r.attachmentType || null,
      attachmentName: r.attachmentBase64 ? 'Current attachment' : ''
    })
    setTab(r.attachmentBase64 ? 'upload' : 'manual')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setTab('manual')
  }

  const handleFile = async e => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return }
    const type = file.type.startsWith('image/') ? 'image' : 'pdf'
    const reader = new FileReader()
    reader.onload = ev => {
      setForm(f => ({ ...f, attachmentBase64: ev.target.result, attachmentType: type, attachmentName: file.name }))
    }
    reader.readAsDataURL(file)
  }

  const removeFile = () => {
    setForm(f => ({ ...f, attachmentBase64: null, attachmentType: null, attachmentName: '' }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.weight || !form.height) { toast.error('Weight and Height are required'); return }
    setSaving(true)
    try {
      const body = {
        weight: +form.weight,
        height: +form.height,
        bodyFatPercentage: form.bodyFatPercentage !== '' ? +form.bodyFatPercentage : null,
        muscleMass: form.muscleMass !== '' ? +form.muscleMass : null,
        visceralFat: form.visceralFat !== '' ? +form.visceralFat : null,
        waterPercentage: form.waterPercentage !== '' ? +form.waterPercentage : null,
        boneMass: form.boneMass !== '' ? +form.boneMass : null,
        notes: form.notes,
        attachmentBase64: form.attachmentBase64 || null,
        attachmentType: form.attachmentType || null,
      }

      if (editId) {
        await api.put(`/trainee/inbody/${editId}`, body)
        toast.success('Record updated ✅')
      } else {
        await api.post('/trainee/inbody', body)
        toast.success('Record saved ✅')
      }

      closeForm()
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const deleteRecord = async (id) => {
    if (!confirm('Delete this InBody record?')) return
    setDeleting(id)
    try {
      await api.delete(`/trainee/inbody/${id}`)
      toast.success('Record deleted')
      setRecords(r => r.filter(x => x.id !== id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const chartData = [...records].reverse().map(r => ({
    date: new Date(r.recordDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    Weight: r.weight,
    'Fat%': r.bodyFatPercentage?.toFixed(1),
    BMI: r.bmi?.toFixed(1),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gym-text">InBody & Measurements</h1>
          <p className="text-gym-muted text-sm">{records.length} records</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} />New Record
        </button>
      </div>

      {showForm && (
        <div className="card glow">
          <h3 className="font-bold text-gym-text mb-4">
            {editId ? '✏️ Edit Measurement' : 'Add New Measurement'}
          </h3>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button type="button" onClick={() => setTab('manual')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'manual' ? 'bg-gym-primary text-white' : 'bg-gym-bg text-gym-muted hover:text-gym-text'}`}>
              Manual Entry
            </button>
            <button type="button" onClick={() => setTab('upload')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${tab === 'upload' ? 'bg-gym-primary text-white' : 'bg-gym-bg text-gym-muted hover:text-gym-text'}`}>
              <Paperclip size={14} />Upload Image / PDF
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Weight (kg) *</label><input type="number" step="0.1" className="input" required value={form.weight} onChange={e => setForm(f => ({...f, weight: e.target.value}))} /></div>
              <div><label className="label">Height (cm) *</label><input type="number" className="input" required value={form.height} onChange={e => setForm(f => ({...f, height: e.target.value}))} /></div>
            </div>

            {tab === 'manual' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Body Fat %</label><input type="number" step="0.1" className="input" value={form.bodyFatPercentage} onChange={e => setForm(f => ({...f, bodyFatPercentage: e.target.value}))} /></div>
                <div><label className="label">Muscle Mass (kg)</label><input type="number" step="0.1" className="input" value={form.muscleMass} onChange={e => setForm(f => ({...f, muscleMass: e.target.value}))} /></div>
                <div><label className="label">Visceral Fat</label><input type="number" step="0.1" className="input" value={form.visceralFat} onChange={e => setForm(f => ({...f, visceralFat: e.target.value}))} /></div>
                <div><label className="label">Water %</label><input type="number" step="0.1" className="input" value={form.waterPercentage} onChange={e => setForm(f => ({...f, waterPercentage: e.target.value}))} /></div>
                <div><label className="label">Bone Mass (kg)</label><input type="number" step="0.1" className="input" value={form.boneMass} onChange={e => setForm(f => ({...f, boneMass: e.target.value}))} /></div>
              </div>
            )}

            {tab === 'upload' && (
              <div>
                {!form.attachmentBase64 ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gym-border rounded-xl p-8 cursor-pointer hover:border-gym-primary transition-colors">
                    <Paperclip size={32} className="text-gym-muted mb-2" />
                    <p className="text-gym-muted text-sm text-center">Click to upload InBody image or PDF</p>
                    <p className="text-gym-muted text-xs mt-1">Max size: 5MB</p>
                    <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
                  </label>
                ) : (
                  <div className="border border-gym-border rounded-xl p-4 flex items-center gap-3">
                    {form.attachmentType === 'image'
                      ? <Image size={24} className="text-gym-primary flex-shrink-0" />
                      : <FileText size={24} className="text-gym-primary flex-shrink-0" />}
                    <span className="text-gym-text text-sm flex-1 truncate">{form.attachmentName}</span>
                    <button type="button" onClick={removeFile} className="text-gym-muted hover:text-red-400 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? 'Saving...' : editId ? 'Update Record' : 'Save Record'}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card">
          <h2 className="font-bold text-gym-text mb-4">Weight Progress</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gym-border)" />
              <XAxis dataKey="date" stroke="var(--gym-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--gym-muted)" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--gym-card)', border: '1px solid var(--gym-border)', borderRadius: '8px', color: 'var(--gym-text)' }} />
              <Line type="monotone" dataKey="Weight" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={30} className="animate-spin text-gym-primary" /></div>
      ) : records.length === 0 ? (
        <div className="card text-center py-12">
          <Activity size={48} className="mx-auto mb-3 text-gym-primary opacity-50" />
          <p className="text-gym-muted">No records yet — add your first measurement!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gym-text text-sm sm:text-base">
                  {new Date(r.recordDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="badge bg-gym-primary/20 text-gym-primary text-xs">BMI: {r.bmi?.toFixed(1)}</span>
                  <button
                    onClick={() => openEdit(r)}
                    className="p-1.5 rounded-lg bg-gym-bg hover:bg-gym-primary/10 text-gym-muted hover:text-gym-primary transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteRecord(r.id)}
                    disabled={deleting === r.id}
                    className="p-1.5 rounded-lg bg-gym-bg hover:bg-red-500/10 text-gym-muted hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  ['Weight', `${r.weight} kg`],
                  ['Height', `${r.height} cm`],
                  ['Body Fat', r.bodyFatPercentage ? `${r.bodyFatPercentage.toFixed(1)}%` : '-'],
                  ['Muscle', r.muscleMass ? `${r.muscleMass} kg` : '-'],
                  ['Water', r.waterPercentage ? `${r.waterPercentage.toFixed(1)}%` : '-'],
                  ['Bone', r.boneMass ? `${r.boneMass} kg` : '-'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gym-bg rounded-lg p-2 text-center">
                    <p className="text-gym-muted text-xs">{k}</p>
                    <p className="text-gym-text font-bold text-sm mt-1">{v}</p>
                  </div>
                ))}
              </div>
              {r.notes && <p className="text-gym-muted text-sm mt-3">📝 {r.notes}</p>}

              {r.attachmentBase64 && r.attachmentType === 'image' && (
                <div className="mt-3">
                  <img src={r.attachmentBase64} alt="InBody" className="max-h-60 rounded-lg border border-gym-border object-contain w-full" />
                </div>
              )}
              {r.attachmentBase64 && r.attachmentType === 'pdf' && (
                <div className="mt-3">
                  <a href={r.attachmentBase64} download="inbody.pdf" className="inline-flex items-center gap-2 text-sm text-gym-primary hover:underline">
                    <FileText size={16} />Download InBody Report (PDF)
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
