import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { PageLoader } from './components/ui/Spinner'
import MainLayout from './components/layout/MainLayout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Schedules from './pages/Schedules'
import Calendar from './pages/Calendar'
import Events from './pages/Events'
import Share from './pages/Share'
import SharedSchedule from './pages/SharedSchedule'
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import CategoryManagement from './pages/admin/CategoryManagement'
import FeedbackManagement from './pages/admin/FeedbackManagement'
import Feedback from './pages/Feedback'
import AIAssistant from './pages/AIAssistant'

// Protected Route Component
function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return <PageLoader />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

// Public Route Component (redirect if already logged in)
function PublicRoute() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return <PageLoader />
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}

// Admin Route Component
function AdminRoute() {
    const { user, isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return <PageLoader />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}

// Placeholder pages

function SharedPage() {
    return <div className="text-center py-20 text-secondary-500">Trang Chia se - Dang phat trien</div>
}

function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-primary-50 to-secondary-50 dark:from-primary-950 dark:via-primary-900 dark:to-secondary-900">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-primary-300 dark:text-primary-400">404</h1>
                <p className="text-xl text-primary-600 dark:text-primary-300 mt-4">Trang khong ton tai</p>
                <a href="/" className="inline-block mt-6 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline">
                    Quay ve trang chu
                </a>
            </div>
        </div>
    )
}

export default function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/schedules" element={<Schedules />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/share" element={<Share />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/ai" element={<AIAssistant />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/categories" element={<CategoryManagement />} />
                    <Route path="/admin/feedbacks" element={<FeedbackManagement />} />
                </Route>
            </Route>

            {/* Public shared schedule */}
            <Route path="/shared/:token" element={<SharedSchedule />} />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}
