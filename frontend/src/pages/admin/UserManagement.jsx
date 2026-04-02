import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
    Search,
    Filter,
    MoreVertical,
    Eye,
    Lock,
    Unlock,
    Key,
    Trash2,
    User,
    Shield,
    Calendar,
    Clock
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'
import { cn } from '@/utils/cn'

// User details dialog component
function UserDetailsDialog({ user, open, onClose }) {
    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-lg font-semibold">{user.full_name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* User info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Vai trò</label>
                            <div className="mt-1">
                                <Badge variant={user.role === 'admin' ? 'error' : 'default'}>
                                    {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Trạng thái</label>
                            <div className="mt-1">
                                <Badge variant={user.is_active ? 'success' : 'error'}>
                                    {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Ngày đăng ký</label>
                            <p className="mt-1 text-sm">
                                {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'Không có dữ liệu'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Đăng nhập cuối</label>
                            <p className="mt-1 text-sm">
                                {user.last_login_at
                                    ? format(new Date(user.last_login_at), 'dd/MM/yyyy HH:mm', { locale: vi })
                                    : 'Chưa đăng nhập'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Thời gian biểu</p>
                                    <p className="text-2xl font-bold text-blue-600">{user.schedule_count || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-green-900">Sự kiện</p>
                                    <p className="text-2xl font-bold text-green-600">{user.event_count || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent events */}
                    {user.recent_events && user.recent_events.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-3">Sự kiện gần đây</h4>
                            <div className="space-y-2">
                                {user.recent_events.slice(0, 5).map((event) => (
                                    <div key={event.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">{event.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(event.start_time), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {event.ActivityCategory?.name_vi || event.ActivityCategory?.name}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Lock user dialog
function LockUserDialog({ user, open, onClose, onConfirm }) {
    const [reason, setReason] = useState('')
    const [sendEmail, setSendEmail] = useState(true)

    const handleSubmit = () => {
        onConfirm(reason, sendEmail)
        setReason('')
        setSendEmail(true)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Khóa tài khoản</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Bạn có chắc muốn khóa tài khoản của <strong>{user?.name}</strong>?
                    </p>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Lý do khóa</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do khóa tài khoản..."
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="sendEmail"
                            checked={sendEmail}
                            onChange={(e) => setSendEmail(e.target.checked)}
                            className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor="sendEmail" className="ml-2 text-sm text-gray-700">
                            Gửi email thông báo cho người dùng
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={!reason.trim()}>
                        Khóa tài khoản
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Reset password dialog
function ResetPasswordDialog({ user, open, onClose, onConfirm, isLoading }) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Đặt lại mật khẩu</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Bạn có chắc đặt lại mật khẩu  <strong>{user?.full_name || user?.email}</strong>?
                    </p>
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        Mật khẩu mới sẽ tự động đổi và gửi về email của người dùng.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Hủy
                    </Button>
                    <Button onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function UserManagement() {
    const [filters, setFilters] = useState({
        page: 1,
        search: '',
        status: 'all'
    })
    const [selectedUser, setSelectedUser] = useState(null)
    const [dialogState, setDialogState] = useState({
        details: false,
        lock: false,
        resetPassword: false,
        delete: false
    })

    const toast = useToast()
    const queryClient = useQueryClient()

    // Fetch users
    const { data: usersData = {}, isLoading } = useQuery({
        queryKey: ['admin', 'users', filters],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: filters.page,
                limit: 20,
                ...(filters.search && { search: filters.search }),
                ...(filters.status && filters.status !== 'all' && { status: filters.status })
            })

            const response = await api.get(`/admin/users?${params}`)
            return response.data
        }
    })

    // Fetch user details
    const { data: userDetails } = useQuery({
        queryKey: ['admin', 'users', selectedUser?.id],
        queryFn: async () => {
            if (!selectedUser?.id) return null
            const response = await api.get(`/admin/users/${selectedUser.id}`)
            return response.data.data
        },
        enabled: !!selectedUser?.id && dialogState.details
    })

    // Toggle user status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ userId, is_active, reason }) => {
            const response = await api.put(`/admin/users/${userId}/status`, {
                is_active,
                reason
            })
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['admin', 'users'])
            toast.success(data.message)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    // Reset password mutation
    const resetPasswordMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await api.post(`/admin/users/${userId}/reset-password`)
            return response.data
        },
        onSuccess: (data) => {
            toast.success(data.message)
            // Neu gui email that bai, hien thi mat khau moi cho admin
            if (data.data?.new_password) {
                toast.success(`Mật khẩu mới: ${data.data.new_password}`, { duration: 10000 })
            }
            closeDialogs()
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await api.delete(`/admin/users/${userId}`)
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['admin', 'users'])
            toast.success(data.message || 'Đã xóa người dùng thành công')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng')
        }
    })

    // Handle actions
    const handleViewDetails = (user) => {
        setSelectedUser(user)
        setDialogState({ ...dialogState, details: true })
    }

    const handleLockUser = (reason, sendEmail) => {
        if (!selectedUser?.id) {
            toast.error('Vui lòng chọn người dùng')
            return
        }
        toggleStatusMutation.mutate({
            userId: selectedUser.id,
            is_active: false,
            reason
        })
    }

    const handleUnlockUser = (user) => {
        if (!user?.id) {
            toast.error('Không tìm thấy người dùng')
            return
        }
        toggleStatusMutation.mutate({
            userId: user.id,
            is_active: true
        })
    }

    const handleResetPassword = (user) => {
        if (!user?.id) {
            toast.error('Không tìm thấy người dùng')
            return
        }
        resetPasswordMutation.mutate(user.id)
    }

    const handleDeleteUser = (user) => {
        if (!user?.id) {
            toast.error('Không tìm thấy người dùng')
            return
        }
        if (window.confirm(`Bạn có chắc muốn xóa người dùng ${user.full_name || user.email}? Hành động này không thể hoàn tác.`)) {
            deleteUserMutation.mutate(user.id)
        }
    }

    const closeDialogs = () => {
        setDialogState({
            details: false,
            lock: false,
            resetPassword: false,
            delete: false
        })
        setSelectedUser(null)
    }

    if (isLoading) {
        return <div className="flex justify-center py-20">Đang tải...</div>
    }

    const { users = [], pagination = {} } = usersData?.data || {}

    return (
        <div className="space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
                <p className="text-gray-600">Quản lý tài khoản và quyền của người dùng</p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Bộ lọc</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm theo tên, email..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="locked">Đã khóa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Danh sách người dùng ({pagination.total || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người dùng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vai trò
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đăng nhập cuối
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={user.role === 'admin' ? 'error' : 'default'}>
                                                {user.role === 'admin' ? (
                                                    <>
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Admin
                                                    </>
                                                ) : (
                                                    <>
                                                        <User className="h-3 w-3 mr-1" />
                                                        User
                                                    </>
                                                )}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={user.is_active ? 'success' : 'error'}>
                                                {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.created_at
                                                ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })
                                                : 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.last_login_at
                                                ? format(new Date(user.last_login_at), 'dd/MM/yyyy', { locale: vi })
                                                : 'Chưa đăng nhập'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative">
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>

                                                {/* Action dropdown - simplified for now */}
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(user)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    {user.role !== 'admin' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => user.is_active
                                                                    ? setSelectedUser(user) || setDialogState(prev => ({ ...prev, lock: true }))
                                                                    : handleUnlockUser(user)
                                                                }
                                                            >
                                                                {user.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedUser(user) || setDialogState(prev => ({ ...prev, resetPassword: true }))}
                                                            >
                                                                <Key className="h-4 w-4" />
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteUser(user)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-500">
                                Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} người dùng
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    Trước
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <UserDetailsDialog
                user={userDetails}
                open={dialogState.details}
                onClose={closeDialogs}
            />

            <LockUserDialog
                user={selectedUser}
                open={dialogState.lock}
                onClose={closeDialogs}
                onConfirm={handleLockUser}
            />

            <ResetPasswordDialog
                user={selectedUser}
                open={dialogState.resetPassword}
                onClose={closeDialogs}
                onConfirm={() => handleResetPassword(selectedUser)}
                isLoading={resetPasswordMutation.isPending}
            />
        </div>
    )
}
