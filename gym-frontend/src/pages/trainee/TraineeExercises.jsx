import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle, Circle, Dumbbell } from 'lucide-react'
import ExerciseMediaThumb from '../../components/ExerciseMediaThumb'

export default function TraineeExercises() {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetch = () => api.get('/trainee/exercises').then(r => setExercises(r.data)).finally(() => setLoading(false))
  useEffect(() => { fetch() }, [])

  const toggleComplete = async id => {
    const r = await api.put(`/trainee/exercises/${id}/complete`)
    setExercises(ex => ex.map(e => e.id === id ? { ...e, isCompleted: r.data.isCompleted } : e))
    toast.success(r.data.isCompleted ? 'Well done! ✅' : 'Unmarked')
  }

  const filtered = filter === 'all' ? exercises : filter === 'done' ? exercises.filter(e => e.isCompleted) : exercises.filter(e => !e.isCompleted)

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">My Exercises</h1>
        <p className="text-gym-muted text-sm">
          {exercises.filter(e => e.isCompleted).length} / {exercises.length} completed
        </p>
      </div>

      {/* Progress */}
      {exercises.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gym-muted">Progress</span>
            <span className="text-gym-primary font-bold text-sm">
              {Math.round((exercises.filter(e => e.isCompleted).length / exercises.length) * 100)}%
            </span>
          </div>
          <div className="bg-gym-bg rounded-full h-3">
            <div
              className="bg-gym-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${(exercises.filter(e => e.isCompleted).length / exercises.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {[['all', 'All'], ['pending', 'Pending'], ['done', 'Completed']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === v ? 'bg-gym-primary text-gym-text' : 'bg-gym-card text-gym-muted hover:text-gym-text'}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Dumbbell size={48} className="mx-auto mb-3 text-gym-primary opacity-30" />
          <p className="text-gym-muted">No exercises yet — waiting for your coach to assign them</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className={`card transition-all ${item.isCompleted ? 'border-gym-green/30 bg-gym-green/5' : 'border-gym-border'}`}>

              <ExerciseMediaThumb
                exerciseId={item.exercise.id}
                mediaUrl={item.exercise.mediaUrl}
                mediaType={item.exercise.mediaType}
                hasMedia={item.exercise.hasMedia}
                endpoint={`/trainee/exercises/${item.exercise.id}/media`}
              />

              <div className="flex items-start gap-3">
                <button onClick={() => toggleComplete(item.id)} className="mt-0.5 flex-shrink-0">
                  {item.isCompleted
                    ? <CheckCircle size={22} className="text-gym-green" />
                    : <Circle size={22} className="text-gym-muted hover:text-gym-primary transition-colors" />
                  }
                </button>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm ${item.isCompleted ? 'line-through text-gym-muted' : 'text-gym-text'}`}>
                    {item.exercise.name}
                  </h3>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {item.day && <span className="badge bg-gym-primary/20 text-gym-primary text-xs">{item.day}</span>}
                    {item.exercise.muscleGroup && <span className="badge bg-blue-500/20 text-blue-400 text-xs">{item.exercise.muscleGroup}</span>}
                  </div>
                  {(item.exercise.sets || item.exercise.reps) && (
                    <p className="text-gym-muted text-xs mt-1">
                      {item.exercise.sets && `${item.exercise.sets} sets`} {item.exercise.reps && `× ${item.exercise.reps} reps`}
                    </p>
                  )}
                  {item.exercise.description && (
                    <p className="text-gym-muted text-xs mt-1 line-clamp-2">{item.exercise.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
