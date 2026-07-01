import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Users, Dumbbell, CreditCard, TrendingUp, Loader2 } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: '👤', color: 'bg-purple-500/20 text-purple-400' },
    { label: 'Trainees', value: stats?.totalTrainees, icon: '🏃', color: 'bg-gym-primary/20 text-gym-primary' },
    { label: 'Coaches', value: stats?.totalCoaches, icon: '🎯', color: 'bg-blue-500/20 text-blue-400' },
    { label: 'Active Subscriptions', value: stats?.activeSubscriptions, icon: '⭐', color: 'bg-gym-gold/20 text-gym-gold' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">Dashboard</h1>
        <p className="text-gym-muted text-sm mt-1">System Overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="card glow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${card.color} mb-4`}>
              {card.icon}
            </div>
            <p className="text-3xl font-black text-gym-text">{card.value ?? 0}</p>
            <p className="text-gym-muted text-sm mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-bold text-gym-text mb-4">🔥 Welcome, Admin!</h2>
        <p className="text-gym-muted text-sm leading-relaxed">
          From here you can manage everything in the system — add users, manage subscriptions, and monitor coaches and trainees.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-gym-bg rounded-lg p-3 text-center">
            <p className="text-xs text-gym-muted">Go to</p>
            <p className="text-gym-primary font-bold text-sm mt-1">Users</p>
          </div>
          <div className="bg-gym-bg rounded-lg p-3 text-center">
            <p className="text-xs text-gym-muted">Go to</p>
            <p className="text-gym-primary font-bold text-sm mt-1">Subscriptions</p>
          </div>
          <div className="bg-gym-bg rounded-lg p-3 text-center">
            <p className="text-xs text-gym-muted">Go to</p>
            <p className="text-gym-primary font-bold text-sm mt-1">Plans</p>
          </div>
        </div>
      </div>
    </div>
  )
}
