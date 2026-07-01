import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { GymInfoProvider } from './context/GymInfoContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCoaches from './pages/admin/AdminCoaches'
import AdminSubscriptions from './pages/admin/AdminSubscriptions'
import AdminPlans from './pages/admin/AdminPlans'
import AdminPayments from './pages/admin/AdminPayments'
import AdminGymSettings from './pages/admin/AdminGymSettings'
import AdminSessions from './pages/admin/AdminSessions'
import AdminInBody from './pages/admin/AdminInBody'

// Coach
import CoachDashboard from './pages/coach/CoachDashboard'
import CoachProfile from './pages/coach/CoachProfile'
import CoachTrainees from './pages/coach/CoachTrainees'
import CoachExercises from './pages/coach/CoachExercises'
import CoachNutrition from './pages/coach/CoachNutrition'
import CoachAttendance from './pages/coach/CoachAttendance'
import CoachInBody from './pages/coach/CoachInBody'

// Trainee
import TraineeDashboard from './pages/trainee/TraineeDashboard'
import TraineeProfile from './pages/trainee/TraineeProfile'
import TraineeInBody from './pages/trainee/TraineeInBody'
import TraineeExercises from './pages/trainee/TraineeExercises'
import TraineeNutrition from './pages/trainee/TraineeNutrition'
import TraineeStats from './pages/trainee/TraineeStats'
import TraineeSubscription from './pages/trainee/TraineeSubscription'
import TraineeChatBot from './pages/trainee/TraineeChatBot'
import TraineeCoaches from './pages/trainee/TraineeCoaches'
import TraineeBranches from './pages/trainee/TraineeBranches'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-gym-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🏋️</div>
        <div className="w-8 h-8 border-4 border-gym-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to={user ? `/${user.role.toLowerCase()}` : '/login'} replace />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['Admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/coaches" element={<ProtectedRoute roles={['Admin']}><AdminCoaches /></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute roles={['Admin']}><AdminSubscriptions /></ProtectedRoute>} />
      <Route path="/admin/plans" element={<ProtectedRoute roles={['Admin']}><AdminPlans /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute roles={['Admin']}><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/gym-settings" element={<ProtectedRoute roles={['Admin']}><AdminGymSettings /></ProtectedRoute>} />
      <Route path="/admin/sessions" element={<ProtectedRoute roles={['Admin']}><AdminSessions /></ProtectedRoute>} />
      <Route path="/admin/inbody" element={<ProtectedRoute roles={['Admin']}><AdminInBody /></ProtectedRoute>} />

      {/* Coach */}
      <Route path="/coach" element={<ProtectedRoute roles={['Coach']}><CoachDashboard /></ProtectedRoute>} />
      <Route path="/coach/profile" element={<ProtectedRoute roles={['Coach']}><CoachProfile /></ProtectedRoute>} />
      <Route path="/coach/trainees" element={<ProtectedRoute roles={['Coach']}><CoachTrainees /></ProtectedRoute>} />
      <Route path="/coach/exercises" element={<ProtectedRoute roles={['Coach']}><CoachExercises /></ProtectedRoute>} />
      <Route path="/coach/nutrition" element={<ProtectedRoute roles={['Coach']}><CoachNutrition /></ProtectedRoute>} />
      <Route path="/coach/attendance" element={<ProtectedRoute roles={['Coach']}><CoachAttendance /></ProtectedRoute>} />
      <Route path="/coach/inbody" element={<ProtectedRoute roles={['Coach']}><CoachInBody /></ProtectedRoute>} />

      {/* Trainee */}
      <Route path="/trainee" element={<ProtectedRoute roles={['Trainee']}><TraineeDashboard /></ProtectedRoute>} />
      <Route path="/trainee/profile" element={<ProtectedRoute roles={['Trainee']}><TraineeProfile /></ProtectedRoute>} />
      <Route path="/trainee/inbody" element={<ProtectedRoute roles={['Trainee']}><TraineeInBody /></ProtectedRoute>} />
      <Route path="/trainee/exercises" element={<ProtectedRoute roles={['Trainee']}><TraineeExercises /></ProtectedRoute>} />
      <Route path="/trainee/nutrition" element={<ProtectedRoute roles={['Trainee']}><TraineeNutrition /></ProtectedRoute>} />
      <Route path="/trainee/stats" element={<ProtectedRoute roles={['Trainee']}><TraineeStats /></ProtectedRoute>} />
      <Route path="/trainee/subscription" element={<ProtectedRoute roles={['Trainee']}><TraineeSubscription /></ProtectedRoute>} />
      <Route path="/trainee/chatbot" element={<ProtectedRoute roles={['Trainee']}><TraineeChatBot /></ProtectedRoute>} />
      <Route path="/trainee/branches" element={<ProtectedRoute roles={['Trainee']}><TraineeBranches /></ProtectedRoute>} />
      <Route path="/trainee/coaches" element={<ProtectedRoute roles={['Trainee']}><TraineeCoaches /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <GymInfoProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: '#141414', color: '#e5e5e5', border: '1px solid #2a2a2a' },
              success: { iconTheme: { primary: '#f97316', secondary: '#0a0a0a' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' } },
              duration: 3500,
            }}
          />
          </GymInfoProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
