import { useQuery } from '@tanstack/react-query'
import {
    Users,
    UserCheck,
    Calendar,
    MessageCircle,
    TrendingUp,
    TrendingDown,
    Activity
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, subDays } from 'date-fns'
import { vi } from 'date-fns/locale'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import api from '@/services/api'

// Stat card component
function StatCard({ title, value, icon: Icon, change, color = 'blue' }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600'
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        {change && (
                            <div className="flex items-center mt-2">
                                {change.trend === 'up' ? (
                                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`text-sm font-medium ${change.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {change.percentage}%
                                </span>
                                <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Recent activity component
function RecentActivity({ activities = [] }) {
    const getActionColor = (action) => {
        switch (action) {
            case 'register': return 'bg-green-100 text-green-800'
            case 'login': return 'bg-blue-100 text-blue-800'
            case 'create_event': return 'bg-purple-100 text-purple-800'
            case 'feedback': return 'bg-amber-100 text-amber-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getActionText = (action) => {
        switch (action) {
            case 'register': return 'Đăng ký'
            case 'login': return 'Đăng nhập'
            case 'create_event': return 'Tạo sự kiện'
            case 'feedback': return 'Gửi phản hồi'
            default: return action
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Hoạt động gần đây
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {!Array.isArray(activities) || activities.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4">Chưa có hoạt động nào</p>
                    ) : (
                        activities.map((activity, index) => (
                            <div key={index} className="flex items-center space-x-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={activity.user_avatar} />
                                    <AvatarFallback>
                                        {activity.user_name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {activity.user_name}
                                        </p>
                                        <Badge className={getActionColor(activity.action)}>
                                            {getActionText(activity.action)}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// Colors for pie chart
const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280']

export default function AdminDashboard() {
    // Fetch stats
    const { data: stats = {} } = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
            const response = await api.get('/admin/stats')
            return response.data.data
        }
    })

    // Fetch user chart data
    const { data: userChartData = [] } = useQuery({
        queryKey: ['admin', 'charts', 'users'],
        queryFn: async () => {
            const response = await api.get('/admin/charts/users?days=30')
            return response.data.data
        }
    })

    // Fetch events by category chart data  
    const { data: categoryChartData = [] } = useQuery({
        queryKey: ['admin', 'charts', 'events-by-category'],
        queryFn: async () => {
            const response = await api.get('/admin/charts/events-by-category')
            return response.data.data
        }
    })

    // Fetch recent activities
    const { data: activities = [] } = useQuery({
        queryKey: ['admin', 'recent-activities'],
        queryFn: async () => {
            const response = await api.get('/admin/recent-activities?limit=10')
            return response.data.data
        }
    })

    return (
        <div className="space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
                <p className="text-gray-600">Thống kê và hoạt động của ứng dụng</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng người dùng"
                    value={stats.totalUsers?.toLocaleString() || '0'}
                    icon={Users}
                    change={stats.usersChange}
                    color="blue"
                />
                <StatCard
                    title="Người dùng hoạt động"
                    value={stats.activeUsers?.toLocaleString() || '0'}
                    icon={UserCheck}
                    change={stats.activeUsersChange}
                    color="green"
                />
                <StatCard
                    title="Tổng sự kiện"
                    value={stats.totalSchedules?.toLocaleString() || '0'}
                    icon={Calendar}
                    change={stats.eventsChange}
                    color="purple"
                />
                <StatCard
                    title="Phản hồi chưa xử lý"
                    value={stats.pendingFeedbacks?.toLocaleString() || '0'}
                    icon={MessageCircle}
                    color="amber"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User registration chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Người dùng đăng ký (30 ngày)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80" style={{ minHeight: '320px' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                                <LineChart data={Array.isArray(userChartData) ? userChartData : []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: vi })}
                                        formatter={(value) => [value, 'Người đăng ký']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Events by category chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sự kiện theo danh mục</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80" style={{ minHeight: '320px' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                                <PieChart>
                                    <Pie
                                        data={Array.isArray(categoryChartData) ? categoryChartData : []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {Array.isArray(categoryChartData) && categoryChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, 'Số sự kiện']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent activities */}
            <RecentActivity activities={activities} />
        </div>
    )
}
