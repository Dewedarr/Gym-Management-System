import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, Check, Star, Smartphone, CreditCard, Banknote, X, Copy, Clock, MapPin, ChevronRight, ChevronLeft } from 'lucide-react'
import { useGymInfo } from '../../context/GymInfoContext'

export default function TraineeSubscription() {
  const { gymInfo } = useGymInfo()
  const [plans, setPlans] = useState([])
  const [current, setCurrent] = useState(null)
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const [step, setStep] = useState(null) // null | 'coach' | 'payment'
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedCoachId, setSelectedCoachId] = useState(null)

  const [payMethod, setPayMethod] = useState('')
  const [payRef, setPayRef] = useState('')
  const [payErr, setPayErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/payment/plans'),
      api.get('/trainee/subscription').catch(() => ({ data: null })),
      api.get('/trainee/coaches').catch(() => ({ data: [] })),
    ]).then(([p, s, c]) => {
      setPlans(p.data)
      setCurrent(s.data)
      setCoaches(c.data)
    }).finally(() => setLoading(false))
  }, [])

  const openPlan = (plan) => {
    setSelectedPlan(plan)
    setPayMethod('')
    setPayRef('')
    setPayErr('')
    setSelectedCoachId(null)
    if (plan.includesPrivateCoach) {
      setStep('coach')
    } else {
      setStep('payment')
    }
  }

  const submitPayment = async () => {
    if (!payMethod) { setPayErr('Please select a payment method'); return }
    if ((payMethod === 'VodafoneCash' || payMethod === 'InstaPay') && !payRef.trim()) {
      setPayErr('Please enter the transaction reference number'); return
    }
    setPayErr('')
    setSubmitting(true)
    try {
      await api.post('/trainee/subscribe', {
        subscriptionPlanId: selectedPlan.id,
        coachId: selectedPlan.includesPrivateCoach ? selectedCoachId : null
      })
      const sub = await api.get('/trainee/subscription')
      await api.post('/payment/submit', {
        subscriptionId: sub.data.id,
        paymentMethod: payMethod,
        paymentReference: payRef || null
      })
      toast.success('Payment request sent. Waiting for admin confirmation ✅')
      setStep(null)
      setCurrent(sub.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  const typeColor = t => ({ Regular: 'border-blue-500/50', Premium: 'border-gym-gold/50', PrivateCoaching: 'border-gym-primary/50' })[t] || ''
  const typeBadge = t => ({ Regular: 'bg-blue-500/20 text-blue-400', Premium: 'bg-gym-gold/20 text-gym-gold', PrivateCoaching: 'bg-gym-primary/20 text-gym-primary' })[t] || ''
  const typeIcon = t => ({ Regular: '🏋️', Premium: '⭐', PrivateCoaching: '🎯' })[t] || '💪'
  const typeLabel = t => ({ Regular: 'Regular', Premium: 'Premium', PrivateCoaching: 'Private' })[t] || t

  const statusBadge = {
    Pending: { label: '⏳ Awaiting Confirmation', cls: 'bg-yellow-500/20 text-yellow-400' },
    Paid: { label: '✅ Paid', cls: 'bg-green-500/20 text-green-400' },
    Rejected: { label: '❌ Rejected', cls: 'bg-red-500/20 text-red-400' },
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">Subscriptions</h1>
        <p className="text-gym-muted text-sm">Choose the right plan for you</p>
      </div>

      {/* Current Subscription */}
      {current && (
        <div className={`card border-2 ${current.paymentStatus === 'Paid' ? 'border-gym-green/40' : 'border-yellow-500/40'}`}>
          <div className="flex items-center gap-4">
            <span className="text-3xl">{current.paymentStatus === 'Paid' ? '✅' : '⏳'}</span>
            <div className="flex-1">
              <h3 className="font-black text-gym-text text-lg">{current.subscriptionPlan?.name}</h3>
              <p className="text-gym-muted text-sm">
                {new Date(current.startDate).toLocaleDateString('en-GB')} → {new Date(current.endDate).toLocaleDateString('en-GB')}
              </p>
              {current.paymentStatus && (
                <span className={`badge text-xs mt-1 ${statusBadge[current.paymentStatus]?.cls}`}>
                  {statusBadge[current.paymentStatus]?.label}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-gym-primary font-black text-2xl">{current.remainingSessionsThisMonth}</p>
              <p className="text-gym-muted text-xs">sessions left</p>
            </div>
          </div>
          {current.paymentStatus === 'Pending' && (
            <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-yellow-400 text-sm">⚠️ Subscription is awaiting payment confirmation from admin. It will be activated after approval.</p>
            </div>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const isCurrent = current?.subscriptionPlanId === plan.id && current?.paymentStatus !== 'Rejected'
          return (
            <div key={plan.id} className={`card border-2 flex flex-col ${isCurrent ? 'border-gym-green' : typeColor(plan.type)} transition-all`}>
              {plan.type === 'Premium' && (
                <div className="mb-2">
                  <span className="badge bg-gym-gold/20 text-gym-gold"><Star size={12} />Most Popular</span>
                </div>
              )}

              <div className="text-center mb-4">
                <span className="text-4xl">{typeIcon(plan.type)}</span>
                <h3 className="font-black text-gym-text text-xl mt-2">{plan.name}</h3>
                <span className={`badge ${typeBadge(plan.type)} mt-1`}>{typeLabel(plan.type)}</span>
              </div>

              <div className="text-center mb-6">
                <p className="text-4xl font-black text-gym-primary">{plan.price}</p>
                <p className="text-gym-muted text-sm">EGP / month</p>
              </div>

              <div className="space-y-2 flex-1">
                {plan.features?.split('|').map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gym-text">
                    <Check size={15} className="text-gym-green flex-shrink-0" />
                    {f}
                  </div>
                ))}
                {plan.includesPrivateCoach && (
                  <div className="mt-3 p-2 bg-gym-primary/10 rounded-lg border border-gym-primary/20 text-xs text-gym-primary">
                    🎯 Choose your coach when subscribing — you can change within the first 2 trial sessions
                  </div>
                )}
              </div>

              <button
                onClick={() => !isCurrent && openPlan(plan)}
                disabled={isCurrent}
                className={`mt-6 w-full py-3 rounded-xl font-bold transition-all ${isCurrent ? 'bg-gym-green/20 text-gym-green cursor-default' : 'btn-primary'}`}
              >
                {isCurrent ? '✓ Currently Subscribed' : plan.includesPrivateCoach ? 'Choose Coach & Subscribe' : 'Subscribe Now'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Gym Booking Info */}
      {gymInfo && (
        <div className="card border border-gym-border">
          <h3 className="font-bold text-gym-text mb-4">📍 Gym Booking Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {gymInfo.workingHours && (
              <div className="flex items-center gap-3 bg-gym-bg rounded-xl p-3">
                <Clock size={18} className="text-gym-primary flex-shrink-0" />
                <div>
                  <p className="text-gym-muted text-xs">Working Hours</p>
                  <p className="text-gym-text font-semibold">{gymInfo.workingHours}</p>
                </div>
              </div>
            )}
            {gymInfo.address && (
              <div className="flex items-center gap-3 bg-gym-bg rounded-xl p-3">
                <MapPin size={18} className="text-gym-primary flex-shrink-0" />
                <div>
                  <p className="text-gym-muted text-xs">Address</p>
                  <p className="text-gym-text font-semibold">{gymInfo.address}</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 p-3 bg-gym-primary/10 rounded-xl border border-gym-primary/20">
            <p className="text-gym-text text-sm">
              💡 For private coaching, choose your coach from the{' '}
              <button onClick={() => navigate('/trainee/coaches')} className="text-gym-primary underline font-semibold">
                Coaches page
              </button>
            </p>
          </div>
        </div>
      )}

      {/* MODAL */}
      {step && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4" dir="ltr">
          <div className="bg-gym-card border border-gym-border rounded-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gym-border sticky top-0 bg-gym-card">
              <div className="flex items-center gap-2">
                {step === 'payment' && selectedPlan.includesPrivateCoach && (
                  <button onClick={() => setStep('coach')} className="p-1 text-gym-muted hover:text-gym-text">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h2 className="font-black text-gym-text">
                  {step === 'coach' ? `Choose Coach — ${selectedPlan.name}` : `Payment — ${selectedPlan.name}`}
                </h2>
              </div>
              <button onClick={() => setStep(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gym-muted">
                <X size={20} />
              </button>
            </div>

            {/* Step: Coach Selection */}
            {step === 'coach' && (
              <div className="p-4 space-y-3">
                <p className="text-gym-muted text-sm">Choose the coach you'll train with. You can change within the first 2 trial sessions.</p>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {coaches.filter(c => c.isAvailable || selectedCoachId === c.id).map(c => (
                    <label key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCoachId === c.id ? 'border-gym-primary bg-gym-primary/10' : 'border-gym-border hover:border-gym-primary/40'}`}>
                      <input type="radio" name="coach-modal" value={c.id}
                        checked={selectedCoachId === c.id}
                        onChange={() => setSelectedCoachId(c.id)}
                        className="hidden" />
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-blue-500/10 flex items-center justify-center">
                        {c.profileImage ? <img src={c.profileImage} className="w-full h-full object-cover" /> : <span className="text-xl">🎯</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gym-text">{c.fullName}</p>
                        <p className="text-gym-muted text-xs">{c.specialization || 'General Fitness'}</p>
                        <p className="text-gym-gold text-xs font-semibold mt-0.5">{c.privateSessionPrice} EGP / session</p>
                      </div>
                      <span className="text-gym-green text-xs">{c.maxPrivateTraineesPerMonth - c.currentTrainees} slots</span>
                    </label>
                  ))}
                  {coaches.filter(c => c.isAvailable).length === 0 && (
                    <p className="text-gym-muted text-center py-6">No coaches available right now</p>
                  )}
                </div>

                <button
                  onClick={() => { if (!selectedCoachId) { toast.error('Please select a coach first'); return } setStep('payment') }}
                  className="btn-primary w-full py-3">
                  Next — Choose Payment Method <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Step: Payment */}
            {step === 'payment' && (
              <div className="p-4 space-y-4">
                {selectedPlan.includesPrivateCoach && selectedCoachId && (() => {
                  const c = coaches.find(x => x.id === selectedCoachId)
                  return c ? (
                    <div className="flex items-center gap-3 bg-gym-primary/10 border border-gym-primary/20 rounded-xl p-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="text-gym-muted text-xs">Selected Coach</p>
                        <p className="font-bold text-gym-text">{c.fullName}</p>
                      </div>
                    </div>
                  ) : null
                })()}

                <div className="bg-gym-bg rounded-xl p-4 text-center">
                  <p className="text-gym-muted text-sm">Amount Due</p>
                  <p className="text-4xl font-black text-gym-primary mt-1">{selectedPlan.price} <span className="text-base font-normal text-gym-muted">EGP</span></p>
                </div>

                <div>
                  <p className="label">Choose Payment Method</p>
                  <div className="space-y-2">
                    {gymInfo?.vodafoneCash && (
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${payMethod === 'VodafoneCash' ? 'border-red-500 bg-red-500/10' : 'border-gym-border hover:border-red-500/50'}`}>
                        <input type="radio" name="method" value="VodafoneCash" checked={payMethod === 'VodafoneCash'} onChange={() => { setPayMethod('VodafoneCash'); setPayErr('') }} className="hidden" />
                        <Smartphone size={20} className="text-red-400" />
                        <div className="flex-1">
                          <p className="font-bold text-gym-text text-sm">Vodafone Cash</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-red-400 text-sm font-mono">{gymInfo.vodafoneCash}</p>
                            <button type="button" onClick={() => copy(gymInfo.vodafoneCash)} className="text-gym-muted hover:text-gym-text"><Copy size={12} /></button>
                          </div>
                        </div>
                      </label>
                    )}
                    {gymInfo?.instaPay && (
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${payMethod === 'InstaPay' ? 'border-blue-500 bg-blue-500/10' : 'border-gym-border hover:border-blue-500/50'}`}>
                        <input type="radio" name="method" value="InstaPay" checked={payMethod === 'InstaPay'} onChange={() => { setPayMethod('InstaPay'); setPayErr('') }} className="hidden" />
                        <CreditCard size={20} className="text-blue-400" />
                        <div className="flex-1">
                          <p className="font-bold text-gym-text text-sm">InstaPay</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-blue-400 text-sm font-mono">{gymInfo.instaPay}</p>
                            <button type="button" onClick={() => copy(gymInfo.instaPay)} className="text-gym-muted hover:text-gym-text"><Copy size={12} /></button>
                          </div>
                        </div>
                      </label>
                    )}
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${payMethod === 'Cash' ? 'border-gym-gold bg-gym-gold/10' : 'border-gym-border hover:border-gym-gold/50'}`}>
                      <input type="radio" name="method" value="Cash" checked={payMethod === 'Cash'} onChange={() => { setPayMethod('Cash'); setPayErr('') }} className="hidden" />
                      <Banknote size={20} className="text-gym-gold" />
                      <div>
                        <p className="font-bold text-gym-text text-sm">Cash at Reception</p>
                        <p className="text-gym-muted text-xs">Pay in person at the gym</p>
                      </div>
                    </label>
                  </div>
                  {payErr && <p className="text-red-400 text-xs mt-2">⚠️ {payErr}</p>}
                </div>

                {(payMethod === 'VodafoneCash' || payMethod === 'InstaPay') && (
                  <div>
                    <label className="label">Transaction Reference / Payment Reference *</label>
                    <input className="input" value={payRef} onChange={e => { setPayRef(e.target.value); setPayErr('') }}
                      placeholder="Enter the transaction number after transfer" dir="ltr" />
                    <p className="text-gym-muted text-xs mt-1">📸 It's also recommended to send a screenshot of the transfer via WhatsApp</p>
                  </div>
                )}

                {payMethod === 'Cash' && (
                  <div className="bg-gym-gold/10 border border-gym-gold/20 rounded-xl p-3">
                    <p className="text-gym-gold text-sm">💡 Your subscription will be activated after paying and confirmation by the receptionist</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={submitPayment} disabled={submitting} className="btn-primary flex-1 py-3">
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : '✅'}
                    {submitting ? 'Submitting...' : 'Confirm Request'}
                  </button>
                  <button onClick={() => setStep(null)} className="btn-secondary px-4">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
