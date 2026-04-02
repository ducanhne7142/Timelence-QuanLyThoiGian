import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, LogOut, User, Settings, Calendar, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useHeader } from '@/context/HeaderContext'
import SearchDialog from '@/components/search/SearchDialog'
import { cn } from '@/utils/cn'
import { useQuery } from '@tanstack/react-query'
import notificationService from '@/services/notificationService'

export default function Header({ onMenuClick, isAdmin = false }) {
    const [showDropdown, setShowDropdown] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const headerRef = useRef(null)
    const hoverTimeoutRef = useRef(null)
    const { user, logout } = useAuth()
    const { setIsHeaderVisible } = useHeader()
    const navigate = useNavigate()

    // Fetch recent notifications (sent in last 24 hours)
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationService.getRecentNotifications().then(res => res.data.data),
        refetchInterval: 30000, // Refetch every 30 seconds
        enabled: !!user, // Only fetch when user is logged in
        retry: 1, // Only retry once on failure
        onError: (error) => {
            console.error('Failed to fetch notifications:', error);
        }
    })

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    // Global search shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + K or just '/' to open search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setShowSearch(true)
            } else if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault()
                setShowSearch(true)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Update header context when visibility changes
    useEffect(() => {
        setIsHeaderVisible(isVisible)
    }, [isVisible, setIsHeaderVisible])

    // Auto-hide header functionality
    useEffect(() => {
        // Keep header visible if dropdowns are open
        if (showDropdown || showNotifications || showSearch) {
            setIsVisible(true)
            return
        }

        const handleMouseMove = (e) => {
            // Show header when mouse is near top (within 80px from top)
            if (e.clientY <= 80) {
                setIsVisible(true)
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                }
            } else {
                // Hide header after 800ms of not hovering near top
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                }
                hoverTimeoutRef.current = setTimeout(() => {
                    if (!showDropdown && !showNotifications && !showSearch) {
                        setIsVisible(false)
                    }
                }, 800)
            }
        }

        const handleMouseEnter = () => {
            setIsVisible(true)
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }

        const handleMouseLeave = () => {
            hoverTimeoutRef.current = setTimeout(() => {
                if (!showDropdown && !showNotifications && !showSearch) {
                    setIsVisible(false)
                }
            }, 800)
        }

        window.addEventListener('mousemove', handleMouseMove)
        const header = headerRef.current
        if (header) {
            header.addEventListener('mouseenter', handleMouseEnter)
            header.addEventListener('mouseleave', handleMouseLeave)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            if (header) {
                header.removeEventListener('mouseenter', handleMouseEnter)
                header.removeEventListener('mouseleave', handleMouseLeave)
            }
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [showDropdown, showNotifications, showSearch])

    return (
        <>
            {/* Trigger zone at top for showing header */}
            <div 
                className="fixed top-0 left-0 right-0 lg:left-64 h-2 z-40"
                onMouseEnter={() => setIsVisible(true)}
            />
            
            <header 
                ref={headerRef}
                className={cn(
                    "fixed left-0 right-0 lg:left-64 z-30 h-14 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm px-4 flex items-center justify-between transition-transform duration-300 ease-in-out",
                    isVisible ? "top-0" : "-top-14"
                )}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 mr-4">
                    <div className="relative">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-md">
                            <Clock className="h-3 w-3 text-primary" />
                        </div>
                    </div>
                    <span className="hidden sm:block text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Time-lence
                    </span>
                </div>

                {/* Left side */}
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <Menu className="h-5 w-5 text-secondary-600" />
                    </button>

                {/* Search */}
                <button
                    onClick={() => setShowSearch(true)}
                    className="hidden sm:flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 text-left hover:bg-white/80 transition-all border border-white/20 shadow-sm"
                >
                    <Search className="h-4 w-4 text-secondary-400" />
                    <span className="text-sm text-secondary-400 w-48 lg:w-64">
                        Tìm kiếm sự kiện...
                    </span>
                    <div className="hidden md:flex items-center gap-1 text-xs text-secondary-400 bg-white/60 px-1.5 py-0.5 rounded ml-auto">
                        <span>⌘K</span>
                    </div>
                </button>

                {/* Mobile search */}
                <button
                    onClick={() => setShowSearch(true)}
                    className="sm:hidden p-2 hover:bg-secondary-100 rounded-lg"
                >
                    <Search className="h-5 w-5 text-secondary-600" />
                </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <Bell className="h-5 w-5 text-secondary-600" />
                        {Array.isArray(notifications) && notifications.length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg" />
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowNotifications(false)}
                            />
                            <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 z-50 max-h-96 overflow-y-auto">
                                <div className="p-3 border-b border-white/20 bg-gradient-to-r from-white/80 to-purple-50/50">
                                    <h3 className="text-sm font-medium text-secondary-800">Thông báo</h3>
                                </div>
                                <div className="p-1">
                                    {isLoading ? (
                                        <div className="p-4 text-center text-sm text-secondary-500">
                                            Đang tải...
                                        </div>
                                    ) : !Array.isArray(notifications) || notifications.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-secondary-500">
                                            Không có thông báo nào
                                        </div>
                                    ) : (
                                        Array.isArray(notifications) && notifications.map((notification) => (
                                            <div key={notification.reminder_id} className="p-3 hover:bg-white/50 rounded-md border-b border-white/20 last:border-b-0 transition-colors">
                                                <div className="text-sm font-medium text-secondary-800">
                                                    {notification.title}
                                                </div>
                                                <div className="text-xs text-secondary-500 mt-1">
                                                    Sự kiện bắt đầu lúc {new Date(notification.start_time).toLocaleString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        timeZone: 'Asia/Ho_Chi_Minh'
                                                    })}
                                                </div>
                                                <div className="text-xs text-primary mt-1">
                                                    Đã nhắc nhở lúc {new Date(notification.sent_at).toLocaleString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        timeZone: 'Asia/Ho_Chi_Minh'
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-lg">
                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="hidden md:block text-sm font-medium text-secondary-700">
                            {user?.full_name}
                        </span>
                    </button>

                    {/* Dropdown */}
                    {showDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 z-50">
                                <div className="p-3 border-b border-white/20 bg-gradient-to-r from-white/80 to-purple-50/50">
                                    <p className="text-sm font-medium text-secondary-800">{user?.full_name}</p>
                                    <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
                                    {isAdmin && (
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white mt-1 shadow-md">
                                            Quản trị viên
                                        </div>
                                    )}
                                </div>
                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false)
                                            navigate('/profile')
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 hover:bg-white/50 rounded-md transition-colors"
                                    >
                                        <User className="h-4 w-4" />
                                        Hồ sơ
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false)
                                            navigate('/settings')
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 hover:bg-white/50 rounded-md transition-colors"
                                    >
                                        <Settings className="h-4 w-4" />
                                        Cài đặt
                                    </button>
                                    <div className="my-1 h-px bg-white/20" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Search Dialog */}
            <SearchDialog
                open={showSearch}
                onClose={() => setShowSearch(false)}
            />
        </header>
        </>
    )
}
