import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Calendar,
    Clock,
    ListTodo,
    Share2,
    Settings,
    Shield,
    X,
    BarChart3,
    Users,
    Tags,
    MessageCircle,
    ArrowLeft,
    Zap
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Thời gian biểu', href: '/schedules', icon: Calendar },
    { name: 'Lịch', href: '/calendar', icon: Calendar },
    { name: 'Sự kiện', href: '/events', icon: ListTodo },
    { name: 'Chia sẻ', href: '/share', icon: Share2 },
    { name: 'Phản hồi', href: '/feedback', icon: MessageCircle },
    { name: 'Cài đặt', href: '/settings', icon: Settings },
]

const adminNavigation = [
    { name: 'Tổng quan', href: '/admin', icon: BarChart3 },
    { name: 'Người dùng', href: '/admin/users', icon: Users },
    { name: 'Danh mục', href: '/admin/categories', icon: Tags },
    { name: 'Phản hồi', href: '/admin/feedbacks', icon: MessageCircle },
]

const adminUserNavigation = [
    { name: 'Quản trị', href: '/admin', icon: Shield },
]

export default function Sidebar({ isOpen, onClose, isAdmin = false }) {
    const { user } = useAuth()
    const userIsAdmin = user?.role === 'admin'

    // Choose navigation based on current mode
    let navigation
    if (isAdmin) {
        navigation = adminNavigation
    } else {
        navigation = userNavigation
        // Add admin link for admin users
        if (userIsAdmin) {
            navigation = [...navigation, ...adminUserNavigation]
        }
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-white/90 backdrop-blur-md border-r border-white/20 shadow-xl text-secondary-700 transition-transform lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-white/20 bg-gradient-to-r from-primary/10 to-purple-500/10">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-md">
                                <Clock className="h-3 w-3 text-primary" />
                            </div>
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Time-lence</span>
                    </div>
                    <button onClick={onClose} className="lg:hidden hover:bg-white/20 p-1 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={onClose}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg'
                                        : 'text-secondary-600 hover:bg-white/50 hover:text-primary'
                                )
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </NavLink>
                    ))}

                    {/* Back to app link for admin mode */}
                    {isAdmin && (
                        <>
                            <div className="pt-4 pb-2">
                                <div className="h-px bg-secondary-200" />
                            </div>
                            <NavLink
                                to="/dashboard"
                                onClick={onClose}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-secondary-600 hover:bg-secondary-100 hover:text-secondary-800"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                Quay lại ứng dụng
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* User info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20 bg-gradient-to-t from-white/50 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-medium shadow-lg">
                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-700 truncate">{user?.full_name}</p>
                            <p className="text-xs text-secondary-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
