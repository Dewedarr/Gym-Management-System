import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Loader2, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TraineeStats() {
  const [stats, setStats] = useState(null)
  const [inbody, setInbody] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/trainee/body-stats').catch(() => ({ data: null })),
      api.get('/trainee/inbody').catch(() => ({ data: [] }))
    ]).then(([s, r]) => {
      setStats(s.data)
      setInbody(r.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gym-primary" /></div>

  if (!stats) return (
    <div className="card text-center py-12">
      <TrendingUp size={48} className="mx-auto mb-3 text-gym-primary opacity-30" />
      <p className="text-gym-muted">Complete your profile first (height, weight, age) to view statistics</p>
    </div>
  )

  const chartData = [...inbody].reverse().map(r => ({
    date: new Date(r.recordDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    Weight: r.weight,
    'Fat%': r.bodyFatPercentage?.toFixed(1),
    Muscle: r.muscleMass,
  }))

  const AR_TO_EN = {
    'وزن طبيعي': 'Normal', 'نقص في الوزن': 'Underweight',
    'زيادة وزن': 'Overweight', 'سمنة': 'Obese',
    'طبيعية': 'Normal', 'منخفضة': 'Low', 'مرتفعة': 'High', 'مقبولة': 'Acceptable',
  }
  const translateCat = v => AR_TO_EN[v] || v

  const bmiCat = translateCat(stats.bmiCategory)
  const bmiColor = ['Normal'].includes(bmiCat) ? '#22c55e' : ['Underweight'].includes(bmiCat) ? '#fbbf24' : '#ef4444'
  const bmiLabel = bmiCat

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gym-text">My Statistics</h1>
        <p className="text-gym-muted text-sm">Comprehensive body analysis</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card glow col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gym-text">Body Mass Index (BMI)</h2>
            <span className="badge" style={{ backgroundColor: `${bmiColor}20`, color: bmiColor }}>
              {bmiLabel}
            </span>
          </div>
          <div className="text-center py-4">
            <p className="text-7xl font-black" style={{ color: bmiColor }}>{stats.bmi}</p>
            <div className="mt-4 relative h-4 bg-gym-bg rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-blue-500/40" />
                <div className="flex-1 bg-gym-green/40" />
                <div className="flex-1 bg-yellow-500/40" />
                <div className="flex-1 bg-red-500/40" />
              </div>
              <div
                className="absolute top-0 w-3 h-4 bg-white rounded-full shadow-lg transition-all"
                style={{ left: `${Math.min(95, Math.max(5, ((stats.bmi - 15) / 25) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gym-muted mt-1">
              <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Estimated Body Fat', value: `${stats.estimatedBodyFat}%`, sub: translateCat(stats.bodyFatCategory), color: '#fbbf24' },
            { label: 'Ideal Weight', value: `${stats.idealWeight?.toFixed(1)} kg`, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="card">
              <p className="text-gym-muted text-xs mb-1">{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              {s.sub && <p className="text-gym-muted text-xs mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Calories */}
      <div className="card">
        <h2 className="font-bold text-white mb-4">Daily Requirements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Calories', value: stats.dailyCalories, unit: 'kcal', color: '#f97316', bg: 'bg-gym-primary/10' },
            { label: 'Protein', value: `${stats.proteinGrams}g`, unit: `${Math.round(stats.proteinGrams * 4)} kcal`, color: '#60a5fa', bg: 'bg-blue-500/10' },
            { label: 'Carbohydrates', value: `${stats.carbsGrams}g`, unit: `${Math.round(stats.carbsGrams * 4)} kcal`, color: '#fbbf24', bg: 'bg-yellow-500/10' },
            { label: 'Fats', value: `${stats.fatsGrams}g`, unit: `${Math.round(stats.fatsGrams * 9)} kcal`, color: '#f87171', bg: 'bg-red-500/10' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.bg}`}>
              <p className="text-gym-muted text-xs">{s.label}</p>
              <p className="text-xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gym-muted text-xs mt-0.5">{s.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card">
          <h2 className="font-bold text-white mb-4">Measurement Progress</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#737373" tick={{ fontSize: 11 }} />
              <YAxis stroke="#737373" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="Weight" stroke="#f97316" fill="url(#wt)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
