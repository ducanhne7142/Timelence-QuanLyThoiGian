import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { eventService } from '@/services/eventService'
import { categoryService } from '@/services/categoryService'
import { scheduleService } from '@/services/scheduleService'

// Color picker options
const colorOptions = [
    { value: '#3B82F6', label: 'Xanh dương', color: '#3B82F6' },
    { value: '#EF4444', label: 'Đỏ', color: '#EF4444' },
    { value: '#10B981', label: 'Xanh lá', color: '#10B981' },
    { value: '#F59E0B', label: 'Vàng cam', color: '#F59E0B' },
    { value: '#8B5CF6', label: 'Tím', color: '#8B5CF6' },
    { value: '#EC4899', label: 'Hồng', color: '#EC4899' },
    { value: '#06B6D4', label: 'Xanh ngọc', color: '#06B6D4' },
    { value: '#6B7280', label: 'Xám', color: '#6B7280' }
]

// Reminder options
const reminderOptions = [
    { value: 0, label: 'Không nhắc' },
    { value: 5, label: '5 phút trước' },
    { value: 15, label: '15 phút trước' },
    { value: 30, label: '30 phút trước' },
    { value: 60, label: '1 giờ trước' },
    { value: 1440, label: '1 ngày trước' }
]

// Validation schema
const eventSchema = z.object({
    title: z.string().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tiêu đề tối đa 200 ký tự'),
    schedule_id: z.number().nullable().optional(),
    category_id: z.number().nullable().optional(),
    start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
    start_time: z.string(),
    end_date: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
    end_time: z.string(),
    all_day: z.boolean().default(false),
    location: z.string().max(300, 'Địa điểm tối đa 300 ký tự').optional(),
    description: z.string().max(1000, 'Mô tả tối đa 1000 ký tự').optional(),
    color: z.string().nullable().optional(),
    reminder_minutes: z.number().default(0),
    reminder_type: z.enum(['email', 'popup', 'both']).default('popup')
})

function ColorPicker({ value, onChange }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">Màu sắc</label>
            <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                    <button
                        key={color.value}
                        type="button"
                        onClick={() => onChange(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${value === color.value ? 'border-secondary-400 scale-110' : 'border-secondary-200'
                            }`}
                        style={{ backgroundColor: color.color }}
                        title={color.label}
                    />
                ))}
            </div>
        </div>
    )
}

export default function EventDialog({
    open,
    onClose,
    selectedDate,
    selectedEvent,
    mode = 'create', // 'create', 'edit', 'view'
    onModeChange
}) {
    const toast = useToast()
    const queryClient = useQueryClient()

    // Fetch data
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
        select: (data) => data.success ? data.data : []
    })

    const { data: schedules = [] } = useQuery({
        queryKey: ['schedules'],
        queryFn: () => scheduleService.getAll(),
        select: (data) => data.success ? data.data : []
    })

    // Form setup
    const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: '',
            schedule_id: null,
            category_id: null,
            start_date: selectedDate ? format(new Date(selectedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            start_time: '09:00',
            end_date: selectedDate ? format(new Date(selectedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            end_time: '10:00',
            all_day: false,
            location: '',
            description: '',
            color: null,
            reminder_minutes: 15,
            reminder_type: 'popup'
        }
    })

    const allDay = watch('all_day')

    // Initialize form for editing
    useEffect(() => {
        if (selectedEvent && mode !== 'create') {
            const startDate = new Date(selectedEvent.start_time)
            const endDate = new Date(selectedEvent.end_time)

            // Get reminder settings from event (if available)
            let reminderMinutes = 15 // default
            let reminderType = 'popup' // default

            if (selectedEvent.reminders && selectedEvent.reminders.length > 0) {
                const firstReminder = selectedEvent.reminders[0]
                reminderMinutes = firstReminder.minutes_before || 15
                reminderType = firstReminder.reminder_type || 'popup'
            }

            reset({
                title: selectedEvent.title || '',
                schedule_id: selectedEvent.schedule_id || null,
                category_id: selectedEvent.category_id || null,
                start_date: format(startDate, 'yyyy-MM-dd'),
                start_time: selectedEvent.all_day ? '09:00' : format(startDate, 'HH:mm'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                end_time: selectedEvent.all_day ? '10:00' : format(endDate, 'HH:mm'),
                all_day: selectedEvent.all_day || false,
                location: selectedEvent.location || '',
                description: selectedEvent.description || '',
                color: selectedEvent.color || null,
                reminder_minutes: reminderMinutes,
                reminder_type: reminderType
            })
        }
    }, [selectedEvent, mode, reset])

    // Mutations
    const createMutation = useMutation({
        mutationFn: eventService.create,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(['events'])
                toast.success('Tạo sự kiện thành công')
                handleClose()
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => {
            console.log('Update event API call:', { id, data })
            return eventService.update(id, data)
        },
        onSuccess: (data) => {
            console.log('Update event success:', data)
            if (data.success) {
                queryClient.invalidateQueries(['events'])
                toast.success('Cập nhật sự kiện thành công')
                handleClose()
            } else {
                console.error('Update failed with response:', data)
                toast.error(data.message || 'Cập nhật thất bại')
            }
        },
        onError: (error) => {
            console.error('Update event error:', error)
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const deleteMutation = useMutation({
        mutationFn: eventService.delete,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(['events'])
                toast.success('Xóa sự kiện thành công')
                handleClose()
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    // Handlers
    const handleClose = () => {
        reset()
        onClose()
    }

    const onSubmit = (data) => {
        console.log('Form submit data:', data)
        console.log('Mode:', mode, 'Selected event:', selectedEvent)

        // Build datetime strings
        const startDateTime = data.all_day
            ? `${data.start_date}T00:00:00`
            : `${data.start_date}T${data.start_time}:00`

        const endDateTime = data.all_day
            ? `${data.end_date}T23:59:59`
            : `${data.end_date}T${data.end_time}:00`

        console.log('Datetime validation:', { startDateTime, endDateTime })

        // Validation: end must be after start
        if (new Date(endDateTime) <= new Date(startDateTime)) {
            console.error('Time validation failed')
            toast.error('Thời gian kết thúc phải sau thời gian bắt đầu')
            return
        }

        const eventData = {
            ...data,
            start_time: startDateTime,
            end_time: endDateTime,
            schedule_id: data.schedule_id === 'none' ? null : data.schedule_id,
            category_id: data.category_id === 'none' ? null : data.category_id,
            reminders: data.reminder_minutes > 0 ? [{
                type: data.reminder_type,
                minutes_before: data.reminder_minutes
            }] : []
        }

        // Remove form-only fields (not API fields)
        delete eventData.start_date
        delete eventData.end_date
        delete eventData.reminder_minutes
        delete eventData.reminder_type

        console.log('Final event data:', eventData)

        if (mode === 'create') {
            console.log('Creating event...')
            createMutation.mutate(eventData)
        } else if (mode === 'edit') {
            console.log('Updating event with ID:', selectedEvent.id)
            updateMutation.mutate({ id: selectedEvent.id, data: eventData })
        }
    }

    const handleDelete = () => {
        if (selectedEvent && confirm('Bạn có chắc muốn xóa sự kiện này?')) {
            deleteMutation.mutate(selectedEvent.id)
        }
    }

    const switchToEditMode = () => {
        if (onModeChange) {
            onModeChange('edit')
        }
    }

    if (mode === 'view') {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-secondary-700">Thời gian</label>
                                <p className="text-sm text-secondary-800">
                                    {selectedEvent?.all_day ? 'Cả ngày' : (() => {
                                        try {
                                            const startDate = new Date(selectedEvent?.start_time);
                                            const endDate = new Date(selectedEvent?.end_time);
                                            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                                                return 'Thời gian không hợp lệ';
                                            }
                                            return `${format(startDate, 'HH:mm dd/MM/yyyy', { locale: vi })} - ${format(endDate, 'HH:mm dd/MM/yyyy', { locale: vi })}`;
                                        } catch (error) {
                                            return 'Thời gian không hợp lệ';
                                        }
                                    })()}
                                </p>
                            </div>

                            {selectedEvent?.location && (
                                <div>
                                    <label className="text-sm font-medium text-secondary-700">Địa điểm</label>
                                    <p className="text-sm text-secondary-800">{selectedEvent.location}</p>
                                </div>
                            )}
                        </div>

                        {selectedEvent?.description && (
                            <div>
                                <label className="text-sm font-medium text-secondary-700">Mô tả</label>
                                <p className="text-sm text-secondary-800">{selectedEvent.description}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={handleClose}>
                                Đóng
                            </Button>
                            <Button onClick={() => switchToEditMode()}>
                                Chỉnh sửa
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Thêm sự kiện mới' : 'Chỉnh sửa sự kiện'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Title */}
                    <Input
                        label="Tiêu đề sự kiện"
                        placeholder="Nhập tiêu đề sự kiện"
                        error={errors.title?.message}
                        {...register('title')}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Schedule */}
                        <div>
                            <label className="text-sm font-medium text-secondary-700">Thời gian biểu</label>
                            <Controller
                                control={control}
                                name="schedule_id"
                                render={({ field: { value, onChange } }) => (
                                    <Select value={value?.toString() || 'none'} onValueChange={(val) => onChange(val === 'none' ? null : parseInt(val))}>
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue placeholder="Chọn thời gian biểu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Không chọn</SelectItem>
                                            {schedules.map((schedule) => (
                                                <SelectItem key={schedule.id} value={schedule.id.toString()}>
                                                    {schedule.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-sm font-medium text-secondary-700">Danh mục</label>
                            <Controller
                                control={control}
                                name="category_id"
                                render={({ field: { value, onChange } }) => (
                                    <Select value={value?.toString() || 'none'} onValueChange={(val) => onChange(val === 'none' ? null : parseInt(val))}>
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue placeholder="Chọn danh mục" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Không chọn</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: category.color }}
                                                        />
                                                        {category.name_vi || category.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    {/* All Day Switch */}
                    <div className="flex items-center gap-3">
                        <Controller
                            control={control}
                            name="all_day"
                            render={({ field: { value, onChange } }) => (
                                <Switch
                                    checked={value}
                                    onCheckedChange={onChange}
                                />
                            )}
                        />
                        <label className="text-sm font-medium text-secondary-700">Cả ngày</label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start Date & Time */}
                        <div>
                            <label className="text-sm font-medium text-secondary-700">Ngày bắt đầu</label>
                            <input
                                type="date"
                                className="mt-1.5 w-full px-3 py-2 border border-secondary-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                {...register('start_date')}
                            />
                            {errors.start_date && (
                                <p className="text-sm text-error mt-1">{errors.start_date.message}</p>
                            )}

                            {!allDay && (
                                <>
                                    <label className="text-sm font-medium text-secondary-700 mt-2 block">Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        className="mt-1.5 w-full px-3 py-2 border border-secondary-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        {...register('start_time')}
                                    />
                                </>
                            )}
                        </div>

                        {/* End Date & Time */}
                        <div>
                            <label className="text-sm font-medium text-secondary-700">Ngày kết thúc</label>
                            <input
                                type="date"
                                className="mt-1.5 w-full px-3 py-2 border border-secondary-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                {...register('end_date')}
                            />
                            {errors.end_date && (
                                <p className="text-sm text-error mt-1">{errors.end_date.message}</p>
                            )}

                            {!allDay && (
                                <>
                                    <label className="text-sm font-medium text-secondary-700 mt-2 block">Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        className="mt-1.5 w-full px-3 py-2 border border-secondary-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        {...register('end_time')}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    <Input
                        label="Địa điểm"
                        placeholder="Nhập địa điểm (tùy chọn)"
                        error={errors.location?.message}
                        {...register('location')}
                    />

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-secondary-700">Mô tả</label>
                        <textarea
                            rows={3}
                            className="mt-1.5 w-full px-3 py-2 border border-secondary-200 rounded-md text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            placeholder="Mô tả sự kiện (tùy chọn)"
                            {...register('description')}
                        />
                        {errors.description && (
                            <p className="text-sm text-error mt-1">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Color Picker */}
                    <Controller
                        control={control}
                        name="color"
                        render={({ field: { value, onChange } }) => (
                            <ColorPicker value={value} onChange={onChange} />
                        )}
                    />

                    {/* Reminders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary-700">Nhắc lịch</label>
                            <Controller
                                control={control}
                                name="reminder_minutes"
                                render={({ field: { value, onChange } }) => (
                                    <Select value={value.toString()} onValueChange={(val) => onChange(parseInt(val))}>
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reminderOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value.toString()}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {watch('reminder_minutes') > 0 && (
                            <div>
                                <label className="text-sm font-medium text-secondary-700">Loại thông báo</label>
                                <Controller
                                    control={control}
                                    name="reminder_type"
                                    render={({ field: { value, onChange } }) => (
                                        <Select value={value} onValueChange={onChange}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="popup">Popup</SelectItem>
                                                <SelectItem value="both">Cả hai</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-6">
                        <div>
                            {mode === 'edit' && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    isLoading={deleteMutation.isPending}
                                >
                                    Xóa
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                isLoading={createMutation.isPending || updateMutation.isPending}
                            >
                                {mode === 'create' ? 'Tạo sự kiện' : 'Cập nhật'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
