import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, User, Shield, Clock, Upload, Save, Key } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { userService } from '@/services/userService'
import { useAuth } from '@/context/AuthContext'

// Validation schemas
const profileSchema = z.object({
    full_name: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(100, 'Họ tên tối đa 100 ký tự'),
    bio: z.string().max(500, 'Giới thiệu tối đa 500 ký tự').optional()
})

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string()
        .min(8, 'Mật khẩu ít nhất 8 ký tự')
        .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
        .regex(/[a-z]/, 'Cần ít nhất 1 chữ thường')
        .regex(/[0-9]/, 'Cần ít nhất 1 số'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
})

// Password strength component
function PasswordStrength({ password }) {
    const getStrength = () => {
        if (!password) return { level: 0, text: '', color: '' }
        let score = 0
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[a-z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++

        if (score <= 2) return { level: 1, text: 'Yếu', color: 'bg-error' }
        if (score <= 3) return { level: 2, text: 'Trung bình', color: 'bg-warning' }
        return { level: 3, text: 'Mạnh', color: 'bg-success' }
    }

    const strength = getStrength()
    if (!password) return null

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded ${i <= strength.level ? strength.color : 'bg-secondary-200'}`}
                    />
                ))}
            </div>
            <p className={`text-xs ${strength.level === 1 ? 'text-error' : strength.level === 2 ? 'text-warning' : 'text-success'}`}>
                Độ mạnh: {strength.text}
            </p>
        </div>
    )
}

// Activity timeline component
function ActivityTimeline({ activities }) {
    const getActivityIcon = (action) => {
        const icons = {
            login: { icon: User, color: 'text-success' },
            logout: { icon: User, color: 'text-secondary-500' },
            update_profile: { icon: User, color: 'text-purple-500' },
            change_password: { icon: Key, color: 'text-warning' },
            create_event: { icon: Clock, color: 'text-primary' },
            update_event: { icon: Clock, color: 'text-warning' },
            delete_event: { icon: Clock, color: 'text-error' }
        }
        return icons[action] || { icon: Clock, color: 'text-secondary-500' }
    }

    const getActionText = (action) => {
        const texts = {
            login: 'Đăng nhập',
            logout: 'Đăng xuất',
            update_profile: 'Cập nhật hồ sơ',
            change_password: 'Đổi mật khẩu',
            create_event: 'Tạo sự kiện',
            update_event: 'Sửa sự kiện',
            delete_event: 'Xóa sự kiện'
        }
        return texts[action] || action
    }

    const formatTime = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now - date

        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Vừa xong'
        if (minutes < 60) return `${minutes} phút trước`
        if (hours < 24) return `${hours} giờ trước`
        return `${days} ngày trước`
    }

    if (!activities?.length) {
        return (
            <div className="text-center py-8 text-secondary-500">
                Chưa có hoạt động nào
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => {
                const { icon: Icon, color } = getActivityIcon(activity.action)
                return (
                    <div key={activity.id || index} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full bg-secondary-50 ${color}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-800">
                                {getActionText(activity.action)}
                            </p>
                            <p className="text-xs text-secondary-500">
                                {formatTime(activity.created_at)}
                            </p>
                            {activity.ip_address && (
                                <p className="text-xs text-secondary-400">
                                    IP: {activity.ip_address}
                                </p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function Profile() {
    const [activeTab, setActiveTab] = useState('info')
    const fileInputRef = useRef(null)
    const { user, setUser, logout } = useAuth()
    const toast = useToast()
    const queryClient = useQueryClient()

    // Fetch profile data
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: userService.getProfile,
        initialData: user
    })

    // Fetch activity logs
    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['activity-logs'],
        queryFn: () => userService.getActivityLogs({ limit: 20 }),
        enabled: activeTab === 'activity'
    })

    // Profile form
    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: '',
            bio: ''
        }
    })

    // Password form
    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    })

    // Reset profile form when profile data loads
    useEffect(() => {
        if (profile) {
            profileForm.reset({
                full_name: profile.full_name || '',
                bio: profile.bio || ''
            })
        }
    }, [profile])

    // Mutations
    const updateProfileMutation = useMutation({
        mutationFn: userService.updateProfile,
        onSuccess: (data) => {
            if (data.success) {
                setUser(data.data)
                queryClient.invalidateQueries(['profile'])
                toast.success('Cập nhật hồ sơ thành công')
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const uploadAvatarMutation = useMutation({
        mutationFn: userService.uploadAvatar,
        onSuccess: (data) => {
            if (data.success) {
                const updatedUser = { ...user, avatar_url: data.data.avatar_url }
                setUser(updatedUser)
                queryClient.invalidateQueries(['profile'])
                toast.success('Upload avatar thành công')
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Upload thất bại')
        }
    })

    const changePasswordMutation = useMutation({
        mutationFn: userService.changePassword,
        onSuccess: (data) => {
            if (data.success) {
                toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại')
                setTimeout(() => {
                    logout()
                }, 2000)
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    // Handlers
    const handleProfileSubmit = (data) => {
        updateProfileMutation.mutate(data)
    }

    const handlePasswordSubmit = (data) => {
        changePasswordMutation.mutate({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword
        })
    }

    const handleAvatarChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File quá lớn. Giới hạn 2MB')
            return
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Chỉ cho phép upload file ảnh')
            return
        }

        uploadAvatarMutation.mutate(file)
    }

    const newPassword = passwordForm.watch('newPassword')

    if (profileLoading) {
        return <div className="flex justify-center py-20">Đang tải...</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            <div>
                <h1 className="text-2xl font-bold text-secondary-800">Hồ sơ cá nhân</h1>
                <p className="text-secondary-500 mt-1">Quản lý thông tin và cài đặt tài khoản</p>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="info" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Thông tin
                            </TabsTrigger>
                            <TabsTrigger value="security" className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Bảo mật
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Lịch sử hoạt động
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab Thông tin */}
                        <TabsContent value="info" className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <Avatar
                                        size="2xl"
                                        src={profile?.avatar_url ? (profile.avatar_url.startsWith('http') ? profile.avatar_url : `http://localhost:5000${profile.avatar_url}`) : null}
                                        alt={profile?.full_name}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadAvatarMutation.isPending}
                                        className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary-600 transition-colors"
                                    >
                                        {uploadAvatarMutation.isPending ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        ) : (
                                            <Camera className="h-4 w-4" />
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-secondary-800">{profile?.full_name}</h3>
                                    <p className="text-secondary-500">{profile?.email}</p>
                                </div>
                            </div>

                            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Họ tên"
                                        error={profileForm.formState.errors.full_name?.message}
                                        {...profileForm.register('full_name')}
                                    />
                                    <Input
                                        label="Email"
                                        value={profile?.email}
                                        disabled
                                        className="bg-secondary-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-secondary-700">Giới thiệu bản thân</label>
                                    <textarea
                                        rows={4}
                                        className="mt-1.5 w-full px-3 py-2 border border-secondary-200 rounded-md text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                        placeholder="Viết vài dòng về bản thân..."
                                        {...profileForm.register('bio')}
                                    />
                                    {profileForm.formState.errors.bio && (
                                        <p className="text-sm text-error mt-1">{profileForm.formState.errors.bio.message}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    isLoading={updateProfileMutation.isPending}
                                    className="w-full md:w-auto"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Lưu thay đổi
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Tab Bảo mật */}
                        <TabsContent value="security" className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-secondary-800 mb-2">Đổi mật khẩu</h3>
                                <p className="text-secondary-500">Cập nhật mật khẩu để bảo mật tài khoản</p>
                            </div>

                            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                                <Input
                                    label="Mật khẩu hiện tại"
                                    type="password"
                                    error={passwordForm.formState.errors.currentPassword?.message}
                                    {...passwordForm.register('currentPassword')}
                                />

                                <div>
                                    <Input
                                        label="Mật khẩu mới"
                                        type="password"
                                        error={passwordForm.formState.errors.newPassword?.message}
                                        {...passwordForm.register('newPassword')}
                                    />
                                    <PasswordStrength password={newPassword} />
                                </div>

                                <Input
                                    label="Xác nhận mật khẩu mới"
                                    type="password"
                                    error={passwordForm.formState.errors.confirmPassword?.message}
                                    {...passwordForm.register('confirmPassword')}
                                />

                                <Button
                                    type="submit"
                                    isLoading={changePasswordMutation.isPending}
                                    className="w-full md:w-auto"
                                >
                                    <Key className="h-4 w-4 mr-2" />
                                    Cập nhật mật khẩu
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Tab Lịch sử hoạt động */}
                        <TabsContent value="activity" className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-secondary-800 mb-2">Lịch sử hoạt động</h3>
                                <p className="text-secondary-500">Theo dõi các hoạt động gần đây</p>
                            </div>

                            {activityLoading ? (
                                <div className="text-center py-8">Đang tải...</div>
                            ) : (
                                <ActivityTimeline activities={activityData?.logs} />
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
