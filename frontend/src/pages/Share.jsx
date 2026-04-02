import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Share2, Copy, Eye, EyeOff, Trash2, Plus, ExternalLink, Calendar, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'

import shareService from '@/services/shareService'
import { scheduleService } from '@/services/scheduleService'

function CreateShareDialog({ trigger }) {
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        schedule_id: '',
        expires_at: '',
        is_password_protected: false,
        password: ''
    })
    const queryClient = useQueryClient()
    const toast = useToast()
    const { isAuthenticated, isLoading: authLoading } = useAuth()

    // Get user schedules
    const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
        queryKey: ['schedules'],
        queryFn: async () => {
            console.log('Fetching user schedules...')
            const result = await scheduleService.getAll()
            console.log('Schedules result:', result)
            // Đảm bảo luôn trả về array
            if (result && result.data && Array.isArray(result.data)) {
                return result.data
            } else if (Array.isArray(result)) {
                return result
            } else {
                return []
            }
        },
        enabled: isAuthenticated && !authLoading,
        onError: (error) => {
            console.error('Error fetching schedules:', error)
        },
        onSuccess: (data) => {
            console.log('Schedules fetched successfully:', data)
        }
    })

    // Create share mutation
    const createShareMutation = useMutation({
        mutationFn: shareService.create,
        onSuccess: (data) => {
            toast.success('Tạo link chia sẻ thành công!')
            queryClient.invalidateQueries(['user-shares'])
            setOpen(false)
            setFormData({
                schedule_id: '',
                expires_at: '',
                is_password_protected: false,
                password: ''
            })

            // Copy link to clipboard
            navigator.clipboard.writeText(data.data.share_url)
            toast.success('Đã sao chép link vào clipboard!')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.schedule_id) {
            toast.error('Vui lòng chọn thời gian biểu')
            return
        }

        // Nếu không set expires_at thì sẽ là null (không hết hạn)
        const submitData = {
            ...formData,
            expires_at: formData.expires_at || null
        }

        createShareMutation.mutate(submitData)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Tạo link chia sẻ</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="schedule">Thời gian biểu</Label>
                        <Select value={formData.schedule_id} onValueChange={(value) =>
                            setFormData(prev => ({ ...prev, schedule_id: value }))
                        }>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn thời gian biểu" />
                            </SelectTrigger>
                            <SelectContent>
                                {schedulesLoading ? (
                                    <SelectItem value="" disabled>Đang tải...</SelectItem>
                                ) : Array.isArray(schedules) && schedules.length > 0 ? (
                                    schedules.map((schedule) => (
                                        <SelectItem key={schedule.id} value={schedule.id.toString()}>
                                            {schedule.title}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="" disabled>Không có thời gian biểu</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="expires_at">Ngày hết hạn (tuỳ chọn)</Label>
                        <Input
                            id="expires_at"
                            type="datetime-local"
                            value={formData.expires_at}
                            onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                        />
                        <p className="text-sm text-secondary-500 mt-1">
                            Bỏ trống để không giới hạn thời gian
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="password_protected" className="text-sm font-medium">
                            Bảo vệ bằng mật khẩu
                        </Label>
                        <Switch
                            id="password_protected"
                            checked={formData.is_password_protected}
                            onCheckedChange={(checked) =>
                                setFormData(prev => ({ ...prev, is_password_protected: checked, password: checked ? prev.password : '' }))
                            }
                        />
                    </div>

                    {formData.is_password_protected && (
                        <div>
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="Nhập mật khẩu"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" isLoading={createShareMutation.isLoading}>
                            Tạo link
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ShareCard({ share }) {
    const queryClient = useQueryClient()
    const toast = useToast()

    // Toggle share mutation
    const toggleMutation = useMutation({
        mutationFn: ({ id, is_active }) => shareService.toggleShare(id, is_active),
        onSuccess: () => {
            queryClient.invalidateQueries(['user-shares'])
            toast.success('Cập nhật thành công!')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    // Delete share mutation
    const deleteMutation = useMutation({
        mutationFn: shareService.deleteShare,
        onSuccess: () => {
            queryClient.invalidateQueries(['user-shares'])
            toast.success('Xóa link chia sẻ thành công!')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const copyLink = () => {
        navigator.clipboard.writeText(share.share_url)
        toast.success('Đã sao chép link!')
    }

    const openLink = () => {
        window.open(share.share_url, '_blank')
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{share.schedule_title}</CardTitle>
                        {share.is_password_protected && (
                            <Lock className="h-4 w-4 text-secondary-500" />
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={share.is_active}
                            onCheckedChange={(checked) =>
                                toggleMutation.mutate({ id: share.id, is_active: checked })
                            }
                            disabled={toggleMutation.isLoading}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-sm text-secondary-600">Link chia sẻ</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <Input
                            value={share.share_url}
                            readOnly
                            className="text-sm"
                        />
                        <Button size="sm" variant="outline" onClick={copyLink}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={openLink}>
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <Label className="text-secondary-600">Trạng thái</Label>
                        <div className="flex items-center gap-2 mt-1">
                            {share.is_active ? (
                                <>
                                    <Eye className="h-4 w-4 text-green-500" />
                                    <span className="text-green-600">Đang chia sẻ</span>
                                </>
                            ) : (
                                <>
                                    <EyeOff className="h-4 w-4 text-secondary-400" />
                                    <span className="text-secondary-500">Tạm dừng</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <Label className="text-secondary-600">Ngày tạo</Label>
                        <p className="mt-1">
                            {format(new Date(share.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                    </div>
                    {share.expires_at && (
                        <div className="col-span-2">
                            <Label className="text-secondary-600">Hết hạn</Label>
                            <p className="mt-1 text-orange-600">
                                {format(new Date(share.expires_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteMutation.mutate(share.id)}
                        isLoading={deleteMutation.isLoading}
                    >
                        <Trash2 className="h-4 w-4" />
                        Xóa
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function Share() {
    const { isAuthenticated, isLoading: authLoading } = useAuth()

    // Get user shares
    const { data: shares = [], isLoading, error } = useQuery({
        queryKey: ['user-shares'],
        queryFn: async () => {
            const result = await shareService.getUserShares()
            return result.data || []
        },
        enabled: isAuthenticated && !authLoading,
        onError: (error) => {
            console.error('Error fetching shares:', error)
        },
        onSuccess: (data) => {
            console.log('Shares fetched successfully:', data)
        }
    })

    // Show loading while auth is being checked
    if (authLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-secondary-500">Đang tải...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-800">Chia sẻ thời gian biểu</h1>
                    <p className="text-secondary-600">Tạo link chia sẻ để người khác xem lịch của bạn</p>
                </div>

                <CreateShareDialog
                    trigger={
                        <Button>
                            <Plus className="h-4 w-4" />
                            Tạo link chia sẻ
                        </Button>
                    }
                />
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Share2 className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-blue-900">Thông tin về chia sẻ</h3>
                            <ul className="text-sm text-blue-800 mt-2 space-y-1">
                                <li>• Người khác chỉ có thể xem, không thể chỉnh sửa lịch của bạn</li>
                                <li>• Bạn có thể tạo mật khẩu bảo vệ hoặc đặt thời hạn cho link</li>
                                <li>• Link có thể được tạm dừng hoặc xóa bất cứ lúc nào</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Shares List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-secondary-500">Đang tải...</p>
                    </div>
                ) : shares.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <Share2 className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-secondary-700 mb-2">
                                Chưa có link chia sẻ nào
                            </h3>
                            <p className="text-secondary-500 mb-4">
                                Tạo link chia sẻ đầu tiên để người khác có thể xem lịch của bạn
                            </p>
                            <CreateShareDialog
                                trigger={
                                    <Button>
                                        <Plus className="h-4 w-4" />
                                        Tạo link đầu tiên
                                    </Button>
                                }
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {shares.map((share) => (
                            <ShareCard key={share.id} share={share} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
