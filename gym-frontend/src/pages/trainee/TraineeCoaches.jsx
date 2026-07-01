import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, Users, CheckCircle, Search, RefreshCw } from 'lucide-react'

export default function TraineeCoaches() {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [myCoachId, setMyCoachId] = useState(null)
  const [trialSessionsUsed, setTrialSessionsUsed] = useState(0)
  const [hasPrivatePlan, setHasPrivatePlan] = useState(false)
  const [selecting, setSelecting] = useState(null)
  const [showChange, setShowChange] = useState(false)
  const navigate = useNavigate()

  // Can change coach only if fewer than 2 trial sessions used
  const canChangeCoach = trialSessionsUsed < 2

  useEffect(() => {
    Promise.all([
      api.get('/trainee/coaches'),
      api.get('/profile/me'),
      api.get('/trainee/subscription').catch(() => ({ data: null }))
    ]).then(([c, p, s]) => {
      setCoaches(c.data)
      const td = p.data.traineeData || {}
      setMyCoachId(td.coachId || null)
      setTrialSessionsUsed(td.trialSessionsUsed || 0)
      const sub = s.data
      setHasPrivatePlan(sub?.subscriptionPlan?.includesPrivateCoach || false)
    }).finally(() => setLoading(false))
  }, [])

  const changeCoach = async (coachId) => {
    setSelecting(coachId)
    try {
      await api.put('/trainee/change-coach', { coachId })
      setMyCoachId(coachId)
      setShowChange(false)
      toast.success('Coach changed successfully ✅')
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally {
      setSelecting(null)
    }
  }

  const myCoach = coaches.find(c => c.id === myCoachId)

  const filtered = coaches.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (c.specialization || '').toLowerCase().includes(search.toLowerCase())
  )

  const changeList = coaches
    .filter(c => c.id !== myCoachId)
    .sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0))

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">Coaches</h1>
        <p className="text-gym-muted text-sm">Browse available coaches and choose one for private training</p>
      </div>

      {/* Current Coach Card */}
      {myCoachId && myCoach && (
        <div className="card border-2 border-gym-green/40 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle size={22} className="text-gym-green flex-shrink-0" />
            <div className="flex-1">
              <p className="text-gym-muted text-xs">Your current coach</p>
              <p className="font-black text-gym-text text-lg leading-tight">{myCoach.fullName}</p>
              <p className="text-gym-muted text-xs">{myCoach.specialization || 'General Fitness'}</p>
            </div>
            {canChangeCoach && (
              <button
                onClick={() => setShowChange(s => !s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${showChange ? 'bg-gym-primary text-white' : 'border border-gym-primary text-gym-primary hover:bg-gym-primary/10'}`}
              >
                <RefreshCw size={14} /> Switch
              </button>
            )}
          </div>

          {/* Trial sessions bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gym-muted">Trial Sessions</span>
              <span className={`text-xs font-bold ${canChangeCoach ? 'text-gym-green' : 'text-red-400'}`}>
                {trialSessionsUsed} / 2
              </span>
            </div>
            <div className="h-2 bg-gym-bg rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${trialSessionsUsed >= 2 ? 'bg-red-500' : 'bg-gym-green'}`}
                style={{ width: `${Math.min((trialSessionsUsed / 2) * 100, 100)}%` }}
              />
            </div>
          </div>

          {!canChangeCoach && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🔒</span>
              <div>
                <p className="font-bold text-red-400 text-sm">Trial Period Ended</p>
                <p className="text-gym-muted text-xs mt-0.5">
                  You've used both trial sessions — you can no longer change your coach. If you have an issue, contact management.
                </p>
              </div>
            </div>
          )}

          {canChangeCoach && (
            <p className="text-xs text-gym-muted">
              <span className="text-gym-green font-bold">{2 - trialSessionsUsed} trial session{2 - trialSessionsUsed !== 1 ? 's' : ''}</span> remaining — after that you cannot change your coach
            </p>
          )}

          {showChange && canChangeCoach && (
            <div className="border-t border-gym-border pt-3 space-y-2">
              <p className="text-sm font-bold text-gym-text mb-2">Choose a new coach:</p>
              {changeList.length === 0 ? (
                <p className="text-gym-muted text-sm text-center py-4">No other coaches available</p>
              ) : (
                changeList.map(c => (
                  <div key={c.id} className="flex items-center gap-3 bg-gym-bg rounded-xl p-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-blue-500/10 flex items-center justify-center">
                      {c.profileImage
                        ? <img src={c.profileImage} className="w-full h-full object-cover" />
                        : <span className="text-lg">🎯</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gym-text text-sm truncate">{c.fullName}</p>
                      <p className="text-gym-muted text-xs">{c.specialization || 'General Fitness'}</p>
                      <span className={`badge text-xs mt-0.5 ${c.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.isAvailable
                          ? `${c.maxPrivateTraineesPerMonth - c.currentTrainees} slots left`
                          : `Full (${c.currentTrainees}/${c.maxPrivateTraineesPerMonth})`
                        }
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gym-primary font-bold text-sm">{c.privateSessionPrice} EGP</p>
                      {c.isAvailable ? (
                        <button
                          onClick={() => changeCoach(c.id)}
                          disabled={!!selecting}
                          className="mt-1 px-3 py-1 bg-gym-primary text-white rounded-lg text-xs font-bold hover:bg-gym-primary-dark transition-colors disabled:opacity-50"
                        >
                          {selecting === c.id ? <Loader2 size={12} className="animate-spin inline" /> : 'Select'}
                        </button>
                      ) : (
                        <span className="mt-1 block px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold text-center">Full</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* No private plan note */}
      {!hasPrivatePlan && (
        <div className="card border border-blue-500/20 bg-blue-500/5">
          <p className="text-gym-text text-sm">
            💡 To choose a private coach, subscribe first to a{' '}
            <button onClick={() => navigate('/trainee/subscription')} className="text-gym-primary underline font-semibold">
              Private Coaching plan
            </button>
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
        <input className="input pl-9" placeholder="Search by coach name or specialization..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Coaches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const isMine = c.id === myCoachId
          const spotsLeft = c.maxPrivateTraineesPerMonth - c.currentTrainees
          return (
            <div key={c.id} className={`card flex flex-col transition-all hover:border-gym-primary/30 ${isMine ? 'border-2 border-gym-green/60' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-blue-500/10 flex items-center justify-center">
                  {c.profileImage
                    ? <img src={c.profileImage} className="w-full h-full object-cover" />
                    : <span className="text-2xl">🎯</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gym-text truncate">{c.fullName}</h3>
                  <p className="text-gym-muted text-sm truncate">{c.specialization || 'General Fitness'}</p>
                  <span className={`badge text-xs mt-1 ${c.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {c.isAvailable
                      ? `${spotsLeft} slot${spotsLeft !== 1 ? 's' : ''} left`
                      : `Full (${c.currentTrainees}/${c.maxPrivateTraineesPerMonth})`
                    }
                  </span>
                </div>
              </div>

              {c.bio && <p className="text-gym-muted text-sm mb-4 line-clamp-2">{c.bio}</p>}

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gym-bg rounded-xl p-3 text-center">
                  <p className="text-gym-primary font-black text-lg">{c.privateSessionPrice || 0}</p>
                  <p className="text-gym-muted text-xs">EGP / session</p>
                </div>
                <div className="bg-gym-bg rounded-xl p-3 text-center">
                  <p className="text-gym-text font-black text-lg">{c.currentTrainees}</p>
                  <p className="text-gym-muted text-xs">trainees</p>
                </div>
              </div>

              <div className="mt-auto">
                {isMine ? (
                  <div className="w-full py-2.5 rounded-xl bg-gym-green/20 text-gym-green text-center font-bold text-sm flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Your Current Coach
                  </div>
                ) : !hasPrivatePlan ? (
                  <button onClick={() => navigate('/trainee/subscription')}
                    className="w-full py-2.5 rounded-xl border border-gym-primary/30 text-gym-primary text-sm font-semibold hover:bg-gym-primary/10 transition-all">
                    Subscribe to Private Plan First
                  </button>
                ) : !canChangeCoach ? (
                  <div className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 text-center text-sm font-semibold">
                    🔒 Trial Sessions Ended
                  </div>
                ) : !c.isAvailable ? (
                  <div className="w-full py-2.5 rounded-xl bg-gym-bg text-gym-muted text-center font-bold text-sm">
                    Full ({c.currentTrainees}/{c.maxPrivateTraineesPerMonth})
                  </div>
                ) : (
                  <button onClick={() => changeCoach(c.id)} disabled={!!selecting}
                    className="w-full py-2.5 rounded-xl btn-primary text-sm flex items-center justify-center gap-2">
                    {selecting === c.id ? <Loader2 size={16} className="animate-spin" /> : myCoachId ? 'Switch to This Coach' : 'Select This Coach'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gym-muted">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>No coaches available right now</p>
        </div>
      )}
    </div>
  )
}
