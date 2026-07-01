import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Loader2, Dumbbell, Users, UserCheck, Upload, Link, X, ChevronDown, Edit2, Check } from 'lucide-react'
import ExerciseMediaThumb from '../../components/ExerciseMediaThumb'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Cardio', 'Full Body']
const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function CoachExercises() {
  const [exercises, setExercises] = useState([])
  const [trainees, setTrainees] = useState([])
  const [selectedTrainee, setSelectedTrainee] = useState('')
  const [traineeExercises, setTraineeExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [mediaMode, setMediaMode] = useState('url')
  const mediaRef = useRef()

  const [assignPopup, setAssignPopup] = useState(null)
  const [assignTraineeId, setAssignTraineeId] = useState('')
  const [assignDay, setAssignDay] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [editDayId, setEditDayId] = useState(null)
  const [editDayVal, setEditDayVal] = useState('')

  const [addFromLib, setAddFromLib] = useState(false)
  const [libExerciseId, setLibExerciseId] = useState('')
  const [libDay, setLibDay] = useState('')
  const [addingLib, setAddingLib] = useState(false)

  const [form, setForm] = useState({
    name: '', description: '', muscleGroup: '', mediaUrl: '', mediaType: 'image',
    sets: '', reps: '', duration: ''
  })

  const fetchAll = () => api.get('/coach/exercises').then(r => setExercises(r.data)).finally(() => setLoading(false))
  const fetchTrainees = () => api.get('/coach/trainees').then(r => setTrainees(r.data))
  const refreshTraineeEx = (tid) => api.get(`/coach/trainees/${tid}`).then(r => setTraineeExercises(r.data.traineeExercises || []))

  useEffect(() => { fetchAll(); fetchTrainees() }, [])
  useEffect(() => {
    if (!selectedTrainee) { setTraineeExercises([]); setAddFromLib(false); return }
    refreshTraineeEx(selectedTrainee)
  }, [selectedTrainee])

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10_000_000) { toast.error('File size too large (max 10MB)'); return }
    const isVideo = file.type.startsWith('video/')
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, mediaUrl: ev.target.result, mediaType: isVideo ? 'video' : 'image' }))
    reader.readAsDataURL(file)
  }

  const create = async e => {
    e.preventDefault()
    try {
      await api.post('/coach/exercises', {
        name: form.name, description: form.description, muscleGroup: form.muscleGroup,
        mediaUrl: form.mediaUrl, mediaType: form.mediaType,
        sets: form.sets, reps: form.reps, duration: form.duration
      })
      toast.success('Exercise added to library ✅')
      setShowForm(false)
      setMediaMode('url')
      setForm({ name: '', description: '', muscleGroup: '', mediaUrl: '', mediaType: 'image', sets: '', reps: '', duration: '' })
      fetchAll()
    } catch { toast.error('An error occurred') }
  }

  const doAssign = async () => {
    if (!assignTraineeId) { toast.error('Select a trainee'); return }
    setAssigning(true)
    try {
      await api.post('/coach/assign-exercise', {
        traineeId: +assignTraineeId,
        exerciseId: assignPopup.exerciseId,
        day: assignDay || null
      })
      toast.success(`"${assignPopup.exerciseName}" assigned to ${trainees.find(t => t.id === +assignTraineeId)?.fullName} ✅`)
      setAssignPopup(null)
      setAssignTraineeId('')
      setAssignDay('')
      if (selectedTrainee === assignTraineeId) refreshTraineeEx(selectedTrainee)
    } catch { toast.error('An error occurred or exercise already assigned') }
    finally { setAssigning(false) }
  }

  const doAddFromLib = async () => {
    if (!libExerciseId) { toast.error('Select an exercise'); return }
    setAddingLib(true)
    try {
      await api.post('/coach/assign-exercise', {
        traineeId: +selectedTrainee,
        exerciseId: +libExerciseId,
        day: libDay || null
      })
      toast.success('Exercise added ✅')
      setLibExerciseId('')
      setLibDay('')
      setAddFromLib(false)
      refreshTraineeEx(selectedTrainee)
    } catch { toast.error('An error occurred or exercise already assigned') }
    finally { setAddingLib(false) }
  }

  const del = async id => {
    if (!confirm('Delete exercise from library?')) return
    await api.delete(`/coach/exercises/${id}`)
    toast.success('Deleted')
    fetchAll()
  }

  const removeAssigned = async (assignedId) => {
    if (!confirm('Remove exercise from trainee program?')) return
    try {
      await api.delete(`/coach/trainee-exercises/${assignedId}`)
      toast.success('Removed ✅')
      refreshTraineeEx(selectedTrainee)
    } catch { toast.error('An error occurred') }
  }

  const saveDay = async (assignedId) => {
    try {
      await api.put(`/coach/trainee-exercises/${assignedId}/day`, { day: editDayVal || null })
      toast.success('Day updated ✅')
      setEditDayId(null)
      refreshTraineeEx(selectedTrainee)
    } catch { toast.error('An error occurred') }
  }

  const displayExercises = selectedTrainee
    ? traineeExercises.map(te => ({ ...te.exercise, assignedId: te.id, day: te.day, isCompleted: te.isCompleted }))
    : exercises

  const resetForm = () => { setShowForm(false); setMediaMode('url'); setForm({ name: '', description: '', muscleGroup: '', mediaUrl: '', mediaType: 'image', sets: '', reps: '', duration: '' }) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gym-text">Exercises</h1>
          <p className="text-gym-muted text-sm">{exercises.length} exercises in your library</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          <Plus size={18} /> New Exercise
        </button>
      </div>

      {/* Trainee Filter */}
      <div className="card py-3 px-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Users size={16} className="text-gym-primary flex-shrink-0" />
          <span className="text-gym-muted text-sm font-semibold">View:</span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedTrainee('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${!selectedTrainee ? 'bg-gym-primary text-white' : 'bg-gym-bg text-gym-muted hover:text-gym-text'}`}>
              My Library
            </button>
            {trainees.map(t => (
              <button key={t.id} onClick={() => setSelectedTrainee(String(t.id))}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${selectedTrainee === String(t.id) ? 'bg-gym-primary text-white' : 'bg-gym-bg text-gym-muted hover:text-gym-text'}`}>
                <UserCheck size={13} />{t.fullName}
              </button>
            ))}
            {trainees.length === 0 && <span className="text-gym-muted text-sm">No trainees yet</span>}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card glow">
          <h3 className="font-bold text-gym-text mb-4">Add Exercise to Library</h3>
          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Exercise Name *</label><input className="input" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
              <div>
                <label className="label">Muscle Group</label>
                <select className="input" value={form.muscleGroup} onChange={e => setForm(f => ({...f, muscleGroup: e.target.value}))}>
                  <option value="">Select</option>
                  {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div><label className="label">Sets</label><input className="input" placeholder="e.g. 3" value={form.sets} onChange={e => setForm(f => ({...f, sets: e.target.value}))} /></div>
              <div><label className="label">Reps</label><input className="input" placeholder="e.g. 12-15" value={form.reps} onChange={e => setForm(f => ({...f, reps: e.target.value}))} /></div>
              <div><label className="label">Duration</label><input className="input" placeholder="e.g. 45 minutes" value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))} /></div>
              <div>
                <label className="label">Media Type</label>
                <select className="input" value={form.mediaType} onChange={e => setForm(f => ({...f, mediaType: e.target.value}))}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="label mb-0">Image / Video (optional)</label>
                <div className="flex gap-1 ml-auto">
                  <button type="button" onClick={() => { setMediaMode('url'); setForm(f => ({...f, mediaUrl: ''})) }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${mediaMode === 'url' ? 'bg-gym-primary text-white' : 'bg-gym-bg text-gym-muted'}`}>
                    <Link size={12} /> URL
                  </button>
                  <button type="button" onClick={() => { setMediaMode('upload'); setForm(f => ({...f, mediaUrl: ''})) }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${mediaMode === 'upload' ? 'bg-gym-primary text-white' : 'bg-gym-bg text-gym-muted'}`}>
                    <Upload size={12} /> Upload
                  </button>
                </div>
              </div>
              {mediaMode === 'url' ? (
                <input className="input" placeholder="https://..." value={form.mediaUrl} onChange={e => setForm(f => ({...f, mediaUrl: e.target.value}))} />
              ) : !form.mediaUrl ? (
                <button type="button" onClick={() => mediaRef.current.click()}
                  className="w-full border-2 border-dashed border-gym-border hover:border-gym-primary rounded-xl p-5 flex flex-col items-center gap-2 transition-colors text-gym-muted hover:text-gym-primary">
                  <Upload size={24} /><span className="text-sm font-semibold">Upload image or video</span>
                  <span className="text-xs">JPG, PNG, MP4 • max 10MB</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden">
                  {form.mediaType === 'video'
                    ? <video src={form.mediaUrl} controls className="w-full max-h-48 object-contain bg-black rounded-xl" />
                    : <img src={form.mediaUrl} alt="preview" className="w-full max-h-48 object-contain rounded-xl bg-gym-bg" />}
                  <button type="button" onClick={() => { setForm(f => ({...f, mediaUrl: ''})); mediaRef.current.value = '' }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X size={14} /></button>
                </div>
              )}
              <input ref={mediaRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
            </div>
            <div><label className="label">Description / Notes (optional)</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">Save to Library</button>
              <button type="button" onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selectedTrainee && (
        <div className="bg-gym-primary/10 border border-gym-primary/30 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-gym-primary font-bold">
              📋 {trainees.find(t => String(t.id) === selectedTrainee)?.fullName} — {displayExercises.length} exercises assigned
            </span>
            <button onClick={() => setAddFromLib(s => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gym-primary text-white rounded-lg text-sm font-semibold hover:bg-gym-primary-dark transition-colors">
              <Plus size={14} /> Add from Library
              <ChevronDown size={13} className={`transition-transform ${addFromLib ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {addFromLib && (
            <div className="flex gap-2 flex-wrap items-end pt-2 border-t border-gym-primary/20">
              <div className="flex-1 min-w-[160px]">
                <label className="label text-xs">Select exercise from library</label>
                <select className="input text-sm" value={libExerciseId} onChange={e => setLibExerciseId(e.target.value)}>
                  <option value="">— Select —</option>
                  {exercises.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}{ex.muscleGroup ? ` (${ex.muscleGroup})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[130px]">
                <label className="label text-xs">Day (optional)</label>
                <select className="input text-sm" value={libDay} onChange={e => setLibDay(e.target.value)}>
                  <option value="">No day</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button onClick={doAddFromLib} disabled={addingLib || !libExerciseId}
                className="btn-primary text-sm py-2.5 px-4 disabled:opacity-50">
                {addingLib ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
              </button>
            </div>
          )}
        </div>
      )}

      {assignPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-gym-card border border-gym-border rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gym-text">Assign Exercise to Trainee</h3>
              <button onClick={() => setAssignPopup(null)} className="text-gym-muted hover:text-red-400 p-1"><X size={20} /></button>
            </div>
            <div className="bg-gym-bg rounded-xl px-4 py-3 flex items-center gap-3">
              <Dumbbell size={20} className="text-gym-primary flex-shrink-0" />
              <p className="font-bold text-gym-text">{assignPopup.exerciseName}</p>
            </div>
            <div>
              <label className="label">Select Trainee *</label>
              <select className="input" value={assignTraineeId} onChange={e => setAssignTraineeId(e.target.value)}>
                <option value="">— Select trainee —</option>
                {trainees.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Day (optional)</label>
              <select className="input" value={assignDay} onChange={e => setAssignDay(e.target.value)}>
                <option value="">No specific day</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={doAssign} disabled={assigning || !assignTraineeId} className="btn-primary flex-1 disabled:opacity-50">
                {assigning ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />} Assign
              </button>
              <button onClick={() => setAssignPopup(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={30} className="animate-spin text-gym-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayExercises.map(e => (
            <div key={e.assignedId || e.id} className="card hover:border-gym-primary/30 transition-colors">
              <ExerciseMediaThumb
                exerciseId={e.id}
                mediaUrl={e.mediaUrl}
                mediaType={e.mediaType}
                hasMedia={e.hasMedia}
                endpoint={`/coach/exercises/${e.id}/media`}
              />

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gym-text">{e.name}</h3>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {e.muscleGroup && <span className="badge bg-gym-primary/20 text-gym-primary text-xs">{e.muscleGroup}</span>}
                    {e.day && editDayId !== e.assignedId && <span className="badge bg-blue-500/20 text-blue-400 text-xs">{e.day}</span>}
                    {!e.day && !editDayId && <span className="badge bg-gym-bg text-gym-muted text-xs">No day</span>}
                    {e.isCompleted && <span className="badge bg-gym-green/20 text-gym-green text-xs">✓ Done</span>}
                  </div>
                </div>
                {!selectedTrainee ? (
                  <button onClick={() => del(e.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gym-muted hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                ) : (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditDayId(e.assignedId); setEditDayVal(e.day || '') }}
                      className="p-1.5 rounded-lg hover:bg-gym-primary/10 text-gym-muted hover:text-gym-primary transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => removeAssigned(e.assignedId)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gym-muted hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {selectedTrainee && editDayId === e.assignedId && (
                <div className="mt-2 flex gap-2 items-center">
                  <select className="input text-xs flex-1 py-1.5" value={editDayVal} onChange={ev => setEditDayVal(ev.target.value)}>
                    <option value="">No day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button onClick={() => saveDay(e.assignedId)} className="p-1.5 rounded-lg bg-gym-green/20 text-gym-green hover:bg-gym-green/30 transition-colors">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditDayId(null)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}

              {(e.sets || e.reps) && (
                <p className="text-gym-muted text-xs mt-2">
                  {e.sets && `${e.sets} sets`} {e.reps && `× ${e.reps} reps`}
                </p>
              )}
              {e.description && <p className="text-gym-muted text-xs mt-1 line-clamp-2">{e.description}</p>}

              {!selectedTrainee && trainees.length > 0 && (
                <button
                  onClick={() => { setAssignPopup({ exerciseId: e.id, exerciseName: e.name }); setAssignTraineeId(''); setAssignDay('') }}
                  className="mt-3 w-full text-xs py-2 rounded-lg border border-gym-primary/30 text-gym-primary hover:bg-gym-primary/10 transition-colors flex items-center justify-center gap-1 font-semibold"
                >
                  <UserCheck size={13} /> Assign to Trainee
                </button>
              )}
            </div>
          ))}
          {displayExercises.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gym-muted">
              <Dumbbell size={48} className="mx-auto mb-3 opacity-30" />
              <p>{selectedTrainee ? 'No exercises assigned — click "Add from Library"' : 'No exercises yet — add your first one!'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
