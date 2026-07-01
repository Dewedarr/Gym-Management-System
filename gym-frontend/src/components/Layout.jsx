import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import {
  LayoutDashboard, Users, Dumbbell, Utensils, Activity,
  MessageSquare, LogOut, Menu, Sun, Moon, X,
  UserCog, CreditCard, TrendingUp, ClipboardList, Settings, Wallet, CalendarCheck, ClipboardCheck, Building2
} from 'lucide-react'
import WhatsAppButton from './WhatsAppButton'
import GymContactBar from './GymContactBar'
import GymContactFooter from './GymContactFooter'
import { useGymInfo } from '../context/GymInfoContext'

const navConfig = {
  Admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Coaches', icon: UserCog, path: '/admin/coaches' },
    { label: 'Subscriptions', icon: CreditCard, path: '/admin/subscriptions' },
    { label: 'Plans', icon: ClipboardList, path: '/admin/plans' },
    { label: 'Payments', icon: Wallet, path: '/admin/payments' },
    { label: 'Sessions', icon: CalendarCheck, path: '/admin/sessions' },
    { label: 'InBody', icon: Activity, path: '/admin/inbody' },
    { label: 'Gym Settings', icon: Settings, path: '/admin/gym-settings' },
  ],
  Coach: [
    { label: 'Home', icon: LayoutDashboard, path: '/coach' },
    { label: 'My Profile', icon: UserCog, path: '/coach/profile' },
    { label: 'My Trainees', icon: Users, path: '/coach/trainees' },
    { label: 'Exercises', icon: Dumbbell, path: '/coach/exercises' },
    { label: 'Nutrition Plans', icon: Utensils, path: '/coach/nutrition' },
    { label: 'InBody', icon: Activity, path: '/coach/inbody' },
    { label: 'Attendance', icon: ClipboardCheck, path: '/coach/attendance' },
  ],
  Trainee: [
    { label: 'Home', icon: LayoutDashboard, path: '/trainee' },
    { label: 'My Profile', icon: UserCog, path: '/trainee/profile' },
    { label: 'InBody', icon: Activity, path: '/trainee/inbody' },
    { label: 'My Exercises', icon: Dumbbell, path: '/trainee/exercises' },
    { label: 'Nutrition', icon: Utensils, path: '/trainee/nutrition' },
    { label: 'My Stats', icon: TrendingUp, path: '/trainee/stats' },
    { label: 'Coaches', icon: UserCog, path: '/trainee/coaches' },
    { label: 'My Subscription', icon: CreditCard, path: '/trainee/subscription' },
    { label: 'Our Branches', icon: Building2, path: '/trainee/branches' },
    { label: 'Fitness Assistant', icon: MessageSquare, path: '/trainee/chatbot' },
  ],
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { gymInfo: gymInfoCtx, heroMedia } = useGymInfo()
  const gymInfo = gymInfoCtx || { gymName: 'GymPro', logoBase64: null }

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const nav = navConfig[user?.role] || []
  const roleLabel = { Admin: 'Admin', Coach: 'Coach', Trainee: 'Trainee' }

  const isActive = (path) =>
    location.pathname === path ||
    (path !== '/admin' && path !== '/coach' && path !== '/trainee' && location.pathname.startsWith(path))

  const SidebarContent = ({ collapsed = false }) => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b ${collapsed ? 'justify-center' : ''}`}
        style={{ borderColor: 'rgb(rgb(var(--gym-border)))' }}>
        <div className="w-9 h-9 bg-gym-primary rounded-xl flex items-center justify-center text-lg flex-shrink-0 pulse-glow overflow-hidden">
          {gymInfo.logoBase64
            ? <img src={gymInfo.logoBase64} className="w-full h-full object-contain" />
            : <span>🏋️</span>
          }
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-gym-primary text-base leading-none truncate">{gymInfo.gymName || 'GymPro'}</h1>
            <p className="text-gym-muted text-xs">{roleLabel[user?.role]}</p>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(s => !s)}
          className="hidden lg:flex text-gym-muted hover:text-gym-text p-1 rounded transition-colors"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-gym-muted hover:text-gym-text p-1 rounded transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {nav.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${isActive(item.path) ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t space-y-0.5" style={{ borderColor: 'rgb(rgb(var(--gym-border)))' }}>
        <button
          onClick={toggle}
          className={`sidebar-link w-full ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? (dark ? 'Light Mode' : 'Dark Mode') : ''}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span className="text-sm">{dark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className={`sidebar-link w-full text-red-500 hover:text-red-400 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </>
  )

  const s = {
    bg: { backgroundColor: 'rgb(var(--gym-bg))' },
    card: { backgroundColor: 'rgb(var(--gym-card))', borderColor: 'rgb(var(--gym-border))' },
    text: { color: 'var(--gym-text)' },
  }

  const isVideoHero = heroMedia && user?.role === 'Trainee' &&
    heroMedia.startsWith('http') && !heroMedia.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) &&
    location.pathname === '/trainee'

  return (
    <div className="flex h-screen overflow-hidden" style={isVideoHero ? {} : s.bg} dir="ltr">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 border-r transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}
        style={{ ...s.card, position: 'relative', zIndex: 1 }}>
        <SidebarContent collapsed={!sidebarOpen} />
      </aside>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE DRAWER ── */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 border-r flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={s.card}>
        <SidebarContent collapsed={false} />
      </aside>

      {/* ── PERSISTENT HERO VIDEO ── */}
      {heroMedia && user?.role === 'Trainee' &&
        (heroMedia.startsWith('http') && !heroMedia.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) && (
        <video
          autoPlay loop muted playsInline preload="auto"
          style={{
            position: 'fixed', inset: 0, zIndex: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            display: location.pathname === '/trainee' ? 'block' : 'none',
            pointerEvents: 'none'
          }}
        >
          <source src={heroMedia} />
        </video>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col"
        style={isVideoHero
          ? { background: 'transparent', position: 'relative', zIndex: 1 }
          : s.bg
        }
      >
        {/* Topbar */}
        <div className="sticky top-0 z-30 backdrop-blur border-b px-4 md:px-6 py-3 flex items-center gap-3"
          style={{
            backgroundColor: 'rgb(var(--gym-card))',
            borderColor: 'rgb(var(--gym-border))'
          }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gym-bg text-gym-muted hover:text-gym-text transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-gym-muted text-xs">Welcome,</p>
            <h2 className="font-bold text-gym-text text-sm truncate">{user?.fullName}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gym-bg text-gym-muted hover:text-gym-text transition-colors"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className={`badge text-xs ${
              user?.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' :
              user?.role === 'Coach' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gym-primary/20 text-gym-primary'
            }`}>
              {roleLabel[user?.role]}
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 fade-in" style={{ background: 'transparent' }}>
          {children}
        </div>
      </main>

      {!location.pathname.includes('/chatbot') && <WhatsAppButton />}
    </div>
  )
}
