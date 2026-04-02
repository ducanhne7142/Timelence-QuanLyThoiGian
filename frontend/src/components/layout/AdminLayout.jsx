import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import MainLayout from './MainLayout'

export default function AdminLayout() {
    const { user, isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-primary-50/20 to-secondary-50/20 dark:from-primary-950 dark:via-primary-900/30 dark:to-secondary-900/20">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    // Use the same MainLayout as user but with admin context
    return <MainLayout isAdmin={true} />
}
