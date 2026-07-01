import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Loader2, Dumbbell, Utensils, Activity, MessageSquare, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useGymInfo } from '../../context/GymInfoContext'

export default function TraineeDashboard() {
  const { user } = useAuth()
  const { dark } = useTheme()
  const { gymInfo, heroMedia } = useGymInfo()
  const bg    = dark ? '#000'  : '#fff'
  const card  = dark ? '#0a0a0a' : '#f5f5f5'
  const sep   = dark ? '#111'  : '#e5e5e5'
  const txt   = dark ? '#fff'  : '#111'
  const muted = dark ? '#444'  : '#888'
  const [profile, setProfile] = useState(null)
  const [sub, setSub] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/trainee/profile'),
      api.get('/trainee/subscription').catch(() => ({ data: null })),
      api.get('/trainee/body-stats').catch(() => ({ data: null })),
    ]).then(([p, s, st]) => {
      setProfile(p.data)
      setSub(s.data)
      setStats(st.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={40} className="animate-spin text-gym-primary" />
    </div>
  )

  const sessionsPerMonth = sub?.subscriptionPlan?.sessionsPerMonth || 0
  const remaining = sub?.remainingSessionsThisMonth ?? 0
  const gymName = (gymInfo?.gymName || 'GymPro').toUpperCase()
  const heroTitle = gymInfo?.heroTitle || 'Discover Your True Strength'
  const heroSubtitle = gymInfo?.heroSubtitle || 'Every day is a step towards a better you'
  const heroBg = heroMedia || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=90'

  const DEFAULT_FEATURES = [
    { icon: '🏋️', label: 'Professional Equipment' },
    { icon: '🛁', label: 'Jacuzzi' },
    { icon: '🧖', label: 'Sauna' },
    { icon: '🥊', label: 'Boxing Hall' },
    { icon: '🚿', label: 'Changing Rooms' },
    { icon: '📡', label: 'Free WiFi' },
  ]
  let features = DEFAULT_FEATURES
  try {
    const parsed = gymInfo?.galleryImagesJson ? JSON.parse(gymInfo.galleryImagesJson) : []
    if (parsed.length > 0) {
      const mapped = parsed.map(p => ({ icon: p.icon || p.url || '✅', label: p.label || p.caption || '' })).filter(f => f.label)
      if (mapped.length > 0) features = mapped
    }
  } catch {}

  const quickActions = [
    { label: 'Exercises',  sublabel: 'Your daily program',   Icon: Dumbbell,      path: '/trainee/exercises' },
    { label: 'Nutrition',  sublabel: 'Your diet plan',       Icon: Utensils,      path: '/trainee/nutrition' },
    { label: 'InBody',     sublabel: 'Your measurements',    Icon: Activity,      path: '/trainee/inbody'    },
    { label: 'Fitness Assistant', sublabel: 'Your personal guide', Icon: MessageSquare, path: '/trainee/chatbot'  },
  ]

  return (
    <div className="-m-4 md:-m-6" style={{ background: 'transparent', minHeight: '100vh' }}>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceSlow {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(6px); }
        }
        .hero-title { animation: fadeUp 1s ease 0.1s both; }
        .hero-sub   { animation: fadeUp 1s ease 0.3s both; }
        .hero-cta   { animation: fadeUp 1s ease 0.5s both; }
        .scroll-ind { animation: bounceSlow 2s ease-in-out infinite; }

        .action-card { transition: all 0.25s ease; cursor: pointer; }
        .action-card:hover { background: #ff7800 !important; }
        .action-card:hover .action-label { color: #000 !important; }
        .action-card:hover .action-sub   { color: rgba(0,0,0,0.6) !important; }
      `}</style>

      {/* ═══════════════════════════════════
          1. HERO — FULL SCREEN
      ═══════════════════════════════════ */}
      <div style={{ position: 'relative', height: '100vh', minHeight: 640 }}>

        {/* Show image only (video handled by Layout to avoid remount) */}
        {!(heroBg.startsWith('http') && !heroBg.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) && (
          <img src={heroBg} style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover'
          }} />
        )}

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 0%, transparent 60%)' }} />

        {/* Gym badge top */}
        <div style={{
          position: 'absolute', top: 28, left: 28,
          color: '#ff7800', fontSize: 10, fontWeight: 900,
          letterSpacing: 4, textTransform: 'uppercase'
        }}>
          {gymName}
        </div>

        {/* Hero content — bottom */}
        <div style={{ position: 'absolute', bottom: 72, left: 32, right: 32 }}>

          <p style={{
            color: '#ff7800', fontSize: 10, fontWeight: 800,
            letterSpacing: 4, textTransform: 'uppercase', marginBottom: 20
          }} className="hero-sub">
            {gymName} &nbsp;—&nbsp; Welcome {user?.fullName}
          </p>

          <h1 className="hero-title" style={{
            fontSize: 'clamp(48px, 7vw, 88px)',
            fontWeight: 900, color: '#fff',
            lineHeight: 1, marginBottom: 20,
            textShadow: '0 2px 40px rgba(0,0,0,0.4)',
            letterSpacing: -1
          }}>
            {heroTitle}
          </h1>

          <p className="hero-sub" style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 15, marginBottom: 36, maxWidth: 480
          }}>
            {heroSubtitle}
          </p>

          <div className="hero-cta" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {sub ? (
              <>
                <div style={{
                  background: '#ff7800', color: '#000',
                  padding: '14px 28px', fontWeight: 900,
                  fontSize: 12, letterSpacing: 2, textTransform: 'uppercase'
                }}>
                  {remaining} sessions left
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  {sub.subscriptionPlan?.name
                    ?.replace('تدريب برايفت', 'Private Coaching')
                    .replace('اشتراك بريميوم', 'Premium')
                    .replace('اشتراك عادي', 'Regular')}
                  {profile?.coachName && <span style={{ marginLeft: 12, color: '#ff7800' }}>· {profile.coachName}</span>}
                </div>
              </>
            ) : (
              <Link to="/trainee/subscription" style={{
                background: '#ff7800', color: '#000',
                padding: '14px 32px', fontWeight: 900,
                fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
                textDecoration: 'none', display: 'inline-block'
              }}>
                Subscribe Now
              </Link>
            )}
          </div>
        </div>

        {/* Scroll arrow */}
        <div className="scroll-ind" style={{
          position: 'absolute', bottom: 24, left: '50%',
          color: 'rgba(255,255,255,0.25)'
        }}>
          <ChevronDown size={22} />
        </div>
      </div>

      {/* ═══════════════════════════════════
          2. STATS — compact badges
      ═══════════════════════════════════ */}
      {stats && (
        <div style={{ background: bg, borderBottom: `1px solid ${sep}`, padding: '36px 32px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {[
              { icon: '📏', val: profile?.height,        unit: 'cm',  label: 'Height' },
              { icon: '⚖️', val: profile?.weight,        unit: 'kg',  label: 'Weight' },
              { icon: '🔥', val: stats.dailyCalories,    unit: 'kcal', label: 'Calories' },
              { icon: '📊', val: stats.bmi,              unit: 'BMI', label: stats.bmiCategory || 'Normal' },
              { icon: '💧', val: stats.estimatedBodyFat, unit: '%',   label: 'Body Fat' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: card, borderRadius: 999,
                padding: '10px 20px', border: `1px solid ${sep}`,
              }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ color: txt, fontWeight: 800, fontSize: 15 }}>{s.val ?? '--'}</span>
                <span style={{ color: '#ff7800', fontWeight: 700, fontSize: 12 }}>{s.unit}</span>
                <span style={{ color: muted, fontSize: 11, marginLeft: 4 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          3. QUICK ACTIONS — 4 rectangles
      ═══════════════════════════════════ */}
      <div style={{ background: bg, borderBottom: `1px solid ${sep}`, padding: '64px 32px' }}>
        <p style={{
          color: '#ff7800', fontSize: 10, fontWeight: 800,
          letterSpacing: 4, textTransform: 'uppercase', marginBottom: 32,
          textAlign: 'center'
        }}>Quick Access</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: sep }}>
          {quickActions.map(({ label, sublabel, path }) => (
            <Link key={path} to={path} style={{ textDecoration: 'none' }}>
              <div className="action-card" style={{
                background: bg, padding: '48px 16px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12, minHeight: 160, textAlign: 'center'
              }}>
                <div className="action-label" style={{ color: txt, fontWeight: 900, fontSize: 20 }}>{label}</div>
                <div className="action-sub" style={{ color: muted, fontSize: 12, letterSpacing: 0.5 }}>{sublabel}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════
          4. FEATURES — 3x2 grid
      ═══════════════════════════════════ */}
      <div style={{ background: bg, padding: '64px 32px 80px' }}>
        <p style={{
          color: '#ff7800', fontSize: 10, fontWeight: 800,
          letterSpacing: 4, textTransform: 'uppercase', marginBottom: 32,
          textAlign: 'center'
        }}>{gymName} Features</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: sep }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: bg, padding: '40px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center'
            }}>
              <span style={{ color: txt, fontWeight: 700, fontSize: 16 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
