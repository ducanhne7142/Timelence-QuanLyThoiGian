import { Calendar, Clock, CheckSquare, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'
import api from '@/services/api'

export default function Dashboard() {
    const { user } = useAuth()

    // Fetch dashboard stats
    const { data: stats = {} } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: async () => {
            const response = await api.get('/users/dashboard/stats')
            return response.data.data
        }
    })

    // Fetch upcoming events
    const { data: upcomingEvents = [] } = useQuery({
        queryKey: ['dashboard', 'upcoming-events'],
        queryFn: async () => {
            const response = await api.get('/users/dashboard/upcoming-events?limit=5')
            return response.data.data
        }
    })

    const statCards = [
        { title: 'Sự kiện hôm nay', value: stats.eventsToday || 0, icon: Calendar, color: 'text-primary-600' },
        { title: 'Sự kiện tuần này', value: stats.eventsThisWeek || 0, icon: Clock, color: 'text-success' },
        { title: 'Hoàn thành', value: `${stats.completionRate || 0}%`, icon: CheckSquare, color: 'text-warning' },
        { title: 'Tổng sự kiện', value: stats.totalEvents || 0, icon: TrendingUp, color: 'text-secondary-600' },
    ]

    const formatTime = (startTime, endTime) => {
        if (!startTime) return ''
        const start = format(new Date(startTime), 'HH:mm')
        const end = endTime ? format(new Date(endTime), 'HH:mm') : ''
        return end ? `${start} - ${end}` : start
    }

    const getCategoryColor = (color) => {
        if (color) return `bg-[${color}]`
        return 'bg-primary'
    }

    return (
        <div className="space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            {/* Welcome */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-200/30 to-secondary-200/30 rounded-2xl blur-xl" />
                <div className="relative bg-gradient-to-br from-white/70 via-primary-50/50 to-secondary-50/50 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-glass dark:from-primary-900/40 dark:via-primary-800/30 dark:to-secondary-900/30">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-secondary-600 bg-clip-text text-transparent dark:from-primary-300 dark:via-primary-400 dark:to-secondary-300">
                        Xin chào, {user?.full_name || 'Bạn'}! 
                    </h1>
                    <p className="text-primary-700/70 dark:text-primary-300/70 mt-3 text-lg font-medium">
                        Chúc bạn một ngày làm việc hiệu quả!
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="group hover:shadow-card-hover transition-all duration-300">
                        <CardContent className="p-6 bg-gradient-to-br from-white/80 to-primary-50/30 dark:from-primary-900/30 dark:to-secondary-900/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-primary-600/70 dark:text-primary-300/70 font-semibold">{stat.title}</p>
                                    <p className="text-3xl font-bold text-primary-800 dark:text-primary-200 mt-2">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-gradient-to-br from-primary-200/50 to-secondary-200/30 dark:from-primary-700/50 dark:to-secondary-700/30 shadow-md group-hover:scale-110 transition-transform ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Upcoming Events */}
            <Card className="hover:shadow-card-hover transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-white/80 to-primary-100/50 dark:from-primary-900/30 dark:to-secondary-900/20 border-b border-white/40">
                    <CardTitle className="bg-gradient-to-r from-primary-700 via-primary-600 to-secondary-600 dark:from-primary-300 dark:via-primary-400 dark:to-secondary-300 bg-clip-text text-transparent">Sự kiện sắp tới</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/20">
                        {Array.isArray(upcomingEvents) && upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event) => (
                                <div key={event.id} className="p-4 hover:bg-primary-50/40 dark:hover:bg-primary-900/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-1 h-12 rounded-full"
                                            style={{ backgroundColor: event.category_color || '#8B5CF6' }}
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-primary-800 dark:text-primary-200">{event.title}</h4>
                                            <p className="text-sm text-primary-600/60 dark:text-primary-300/60">
                                                {formatTime(event.start_time, event.end_time)}
                                            </p>
                                        </div>
                                        {event.category_name && (
                                            <span className="text-xs px-3 py-1 rounded-full bg-primary-100/60 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium">
                                                {event.category_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-sm text-primary-600/60 dark:text-primary-300/60">Không có sự kiện sắp tới</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer group hover:shadow-card-hover transition-all duration-300">
                    <CardContent className="p-6 bg-gradient-to-br from-white/80 to-secondary-50/30 dark:from-primary-900/30 dark:to-secondary-900/20 text-center rounded-lg">
                        <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-primary-200/50 to-primary-100/30 dark:from-primary-700/50 dark:to-primary-600/30 mb-3 group-hover:scale-110 transition-transform">
                            <Calendar className="h-10 w-10 text-primary-600 dark:text-primary-300" />
                        </div>
                        <h3 className="font-semibold text-primary-800 dark:text-primary-200">Xem lịch</h3>
                        <p className="text-sm text-primary-600/60 dark:text-primary-300/60 mt-1">Quản lý sự kiện của bạn</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer group hover:shadow-card-hover transition-all duration-300">
                    <CardContent className="p-6 bg-gradient-to-br from-white/80 to-secondary-50/30 dark:from-primary-900/30 dark:to-secondary-900/20 text-center rounded-lg">
                        <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-success/20 to-success/10 dark:from-success/30 dark:to-success/20 mb-3 group-hover:scale-110 transition-transform">
                            <Clock className="h-10 w-10 text-success" />
                        </div>
                        <h3 className="font-semibold text-primary-800 dark:text-primary-200">Thêm sự kiện</h3>
                        <p className="text-sm text-primary-600/60 dark:text-primary-300/60 mt-1">Tạo sự kiện mới nhanh chóng</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
