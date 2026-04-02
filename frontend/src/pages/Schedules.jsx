import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Plus,
    Calendar,
    MoreHorizontal,
    Edit,
    Share2,
    Trash2,
    Globe,
    Copy,
    Eye,
    AlertCircle,
    Users
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import { scheduleService } from '@/services/scheduleService'

// Validation schema
const scheduleSchema = z.object({
    title: z.string().min(1, 'Tên thời gian biểu là bắt buộc').max(200, 'Tên tối đa 200 ký tự'),
    description: z.string().max(1000, 'Mô tả tối đa 1000 ký tự').optional()
})

function ScheduleCard({ schedule, onEdit, onDelete, onShare }) {
    const [showActions, setShowActions] = useState(false)

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    const truncateText = (text, maxLength = 100) => {
        if (!text) return ''
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    return (
        <Card className="card-hover relative">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg mb-2 pr-8">{schedule.title}</CardTitle>
                        {schedule.description && (
                            <p className="text-sm text-secondary-500 mb-3">
                                {truncateText(schedule.description)}
                            </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-secondary-500">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{schedule.event_count || 0} sự kiện</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>Tạo: {formatDate(schedule.created_at)}</span>
                            </div>
                            {schedule.is_public && (
                                <div className="flex items-center gap-1">
                                    <Globe className="h-4 w-4 text-success" />
                                    <span className="text-success font-medium">Public</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowActions(!showActions)}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {showActions && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowActions(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-20">
                                    <div className="p-1">
                                        <button
                                            onClick={() => {
                                                onEdit(schedule)
                                                setShowActions(false)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-md"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            onClick={() => {
                                                onShare(schedule)
                                                setShowActions(false)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-md"
                                        >
                                            <Share2 className="h-4 w-4" />
                                            Chia sẻ
                                        </button>
                                        <div className="my-1 h-px bg-secondary-100" />
                                        <button
                                            onClick={() => {
                                                onDelete(schedule)
                                                setShowActions(false)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-red-50 rounded-md"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
}

function ScheduleDialog({ schedule, open, onClose, onSubmit, isLoading }) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            title: schedule?.title || '',
            description: schedule?.description || ''
        }
    })

    const handleClose = () => {
        reset()
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {schedule ? 'Chỉnh sửa thời gian biểu' : 'Tạo thời gian biểu mới'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Tên thời gian biểu"
                        placeholder="Nhập tên thời gian biểu"
                        error={errors.title?.message}
                        {...register('title')}
                    />

                    <div>
                        <label className="text-sm font-medium text-secondary-700">Mô tả</label>
                        <textarea
                            rows={3}
                            className="mt-1.5 w-full px-3 py-2 border border-secondary-200 rounded-md text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            placeholder="Mô tả thời gian biểu (tùy chọn)"
                            {...register('description')}
                        />
                        {errors.description && (
                            <p className="text-sm text-error mt-1">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            {schedule ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ShareDialog({ schedule, open, onClose }) {
    const toast = useToast()

    // Share functionality disabled - not available in current backend
    const handleToggleShare = (checked) => {
        toast.error('Tính năng chia sẻ tạm thời không khả dụng')
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chia sẻ thời gian biểu</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Tính năng tạm thời không khả dụng</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                            Tính năng chia sẻ thời gian biểu đang được phát triển và sẽ có sẵn trong phiên bản tiếp theo.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={onClose}>
                            Đóng
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function DeleteDialog({ schedule, open, onClose, onConfirm, isLoading }) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Xác nhận xóa</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-secondary-700">
                        Bạn có chắc muốn xóa thời gian biểu <strong>"{schedule?.title}"</strong>?
                    </p>
                    <p className="text-sm text-error mt-2">
                        Tất cả sự kiện trong thời gian biểu này sẽ bị xóa theo.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        Xóa
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function Schedules() {
    const [dialogState, setDialogState] = useState({
        create: false,
        edit: false,
        share: false,
        delete: false
    })
    const [selectedSchedule, setSelectedSchedule] = useState(null)

    const toast = useToast()
    const queryClient = useQueryClient()

    // Fetch schedules
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ['schedules'],
        queryFn: () => scheduleService.getAll(),
        select: (data) => data.success ? data.data : []
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: scheduleService.create,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(['schedules'])
                setDialogState(prev => ({ ...prev, create: false }))
                toast.success('Tạo thời gian biểu thành công')
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => scheduleService.update(id, data),
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(['schedules'])
                setDialogState(prev => ({ ...prev, edit: false }))
                setSelectedSchedule(null)
                toast.success('Cập nhật thời gian biểu thành công')
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const deleteMutation = useMutation({
        mutationFn: scheduleService.delete,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(['schedules'])
                setDialogState(prev => ({ ...prev, delete: false }))
                setSelectedSchedule(null)
                toast.success('Xóa thời gian biểu thành công')
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    // Handlers
    const handleCreate = (data) => {
        createMutation.mutate(data)
    }

    const handleEdit = (schedule) => {
        setSelectedSchedule(schedule)
        setDialogState(prev => ({ ...prev, edit: true }))
    }

    const handleUpdate = (data) => {
        updateMutation.mutate({ id: selectedSchedule.id, data })
    }

    const handleShare = (schedule) => {
        setSelectedSchedule(schedule)
        setDialogState(prev => ({ ...prev, share: true }))
    }

    const handleDelete = (schedule) => {
        setSelectedSchedule(schedule)
        setDialogState(prev => ({ ...prev, delete: true }))
    }

    const handleConfirmDelete = () => {
        if (selectedSchedule) {
            deleteMutation.mutate(selectedSchedule.id)
        }
    }

    if (isLoading) {
        return <div className="flex justify-center py-20">Đang tải...</div>
    }

    return (
        <div className="space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-800">Thời gian biểu của tôi</h1>
                    <p className="text-secondary-500 mt-1">Quản lý các thời gian biểu và sự kiện</p>
                </div>
                <Button onClick={() => setDialogState(prev => ({ ...prev, create: true }))}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo mới
                </Button>
            </div>

            {/* Content */}
            {schedules.length === 0 ? (
                <div className="text-center py-20">
                    <Calendar className="h-20 w-20 mx-auto text-secondary-300 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-800 mb-2">Chưa có thời gian biểu nào</h3>
                    <p className="text-secondary-500 mb-6">Tạo thời gian biểu đầu tiên để bắt đầu quản lý sự kiện</p>
                    <Button onClick={() => setDialogState(prev => ({ ...prev, create: true }))}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo thời gian biểu mới
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {schedules.map((schedule) => (
                        <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onShare={handleShare}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <ScheduleDialog
                open={dialogState.create}
                onClose={() => setDialogState(prev => ({ ...prev, create: false }))}
                onSubmit={handleCreate}
                isLoading={createMutation.isPending}
            />

            <ScheduleDialog
                schedule={selectedSchedule}
                open={dialogState.edit}
                onClose={() => {
                    setDialogState(prev => ({ ...prev, edit: false }))
                    setSelectedSchedule(null)
                }}
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
            />

            <ShareDialog
                schedule={selectedSchedule}
                open={dialogState.share}
                onClose={() => {
                    setDialogState(prev => ({ ...prev, share: false }))
                    setSelectedSchedule(null)
                }}
            />

            <DeleteDialog
                schedule={selectedSchedule}
                open={dialogState.delete}
                onClose={() => {
                    setDialogState(prev => ({ ...prev, delete: false }))
                    setSelectedSchedule(null)
                }}
                onConfirm={handleConfirmDelete}
                isLoading={deleteMutation.isPending}
            />
        </div>
    )
}
