import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
    Calendar,
    Clock,
    MapPin,
    Download,
    Filter,
    Search,
    ChevronDown,
    Edit,
    Trash2,
    X
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import { eventService } from '@/services/eventService'
import { scheduleService } from '@/services/scheduleService'
import { categoryService } from '@/services/categoryService'
import EventDialog from '@/components/calendar/EventDialog'
import api from '@/services/api'
import { cn } from '@/utils/cn'

// Event card component
function EventCard({ event, onEventClick }) {
    const categoryColors = {
        1: '#3B82F6', // Study
        2: '#EF4444', // Work  
        3: '#10B981', // Exercise
        4: '#F59E0B', // Meal
        5: '#8B5CF6', // Sleep
        6: '#EC4899', // Entertainment
        7: '#06B6D4', // Meeting
        8: '#6B7280'  // Other
    }

    const eventColor = event.color || categoryColors[event.category_id] || '#6B7280'

    return (
        <Card className="card-hover cursor-pointer" onClick={() => onEventClick(event)}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Color indicator */}
                    <div
                        className="w-1 h-16 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: eventColor }}
                    />

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-secondary-800 truncate">
                                    {event.title}
                                </h3>

                                {/* Time */}
                                <div className="flex items-center gap-1 text-sm text-secondary-600 mt-1">
                                    <Clock className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                        {event.all_day
                                            ? 'Cả ngày'
                                            : `${format(new Date(event.start_time), 'HH:mm', { locale: vi })} - ${format(new Date(event.end_time), 'HH:mm', { locale: vi })}`
                                        }
                                    </span>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-1 text-sm text-secondary-600 mt-1">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                        {format(new Date(event.start_time), 'EEEE, dd/MM/yyyy', { locale: vi })}
                                    </span>
                                </div>

                                {/* Location */}
                                {event.location && (
                                    <div className="flex items-center gap-1 text-sm text-secondary-600 mt-1">
                                        <MapPin className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                )}

                                {/* Description */}
                                {event.description && (
                                    <p className="text-sm text-secondary-600 mt-2 line-clamp-2">
                                        {event.description}
                                    </p>
                                )}
                            </div>

                            {/* Category badge */}
                            {event.category_name && (
                                <span
                                    className="px-2 py-1 text-xs rounded-full text-white font-medium flex-shrink-0"
                                    style={{ backgroundColor: eventColor }}
                                >
                                    {event.category_name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Event detail modal component
function EventDetailModal({ event, open, onClose, onEdit, onDelete, isDeleting }) {
    if (!event) return null

    const categoryColors = {
        1: '#3B82F6', 2: '#EF4444', 3: '#10B981', 4: '#F59E0B',
        5: '#8B5CF6', 6: '#EC4899', 7: '#06B6D4', 8: '#6B7280'
    }

    const eventColor = event.color || categoryColors[event.category_id] || '#6B7280'

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: eventColor }}
                        />
                        {event.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Time & Date */}
                    <div>
                        <h3 className="text-sm font-medium text-secondary-700 mb-2">Thời gian</h3>
                        <div className="flex items-center gap-2 text-secondary-800">
                            <Clock className="h-4 w-4" />
                            <span>
                                {event.all_day
                                    ? 'Cả ngày'
                                    : `${format(new Date(event.start_time), 'HH:mm', { locale: vi })} - ${format(new Date(event.end_time), 'HH:mm', { locale: vi })}`
                                }
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-secondary-800 mt-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {format(new Date(event.start_time), 'EEEE, dd/MM/yyyy', { locale: vi })}
                            </span>
                        </div>
                    </div>

                    {/* Location */}
                    {event.location && (
                        <div>
                            <h3 className="text-sm font-medium text-secondary-700 mb-2">Địa điểm</h3>
                            <div className="flex items-center gap-2 text-secondary-800">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div>
                            <h3 className="text-sm font-medium text-secondary-700 mb-2">Mô tả</h3>
                            <p className="text-secondary-800 whitespace-pre-wrap">{event.description}</p>
                        </div>
                    )}

                    {/* Category */}
                    {event.category_name && (
                        <div>
                            <h3 className="text-sm font-medium text-secondary-700 mb-2">Danh mục</h3>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: eventColor }}
                                />
                                <span className="text-secondary-800">{event.category_name}</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Đóng
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onEdit(event)}
                            className="flex items-center gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            Chỉnh sửa
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => onDelete(event)}
                            isLoading={isDeleting}
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Xóa
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Export dropdown component
function ExportDropdown({ onExport, isExporting }) {
    const [isOpen, setIsOpen] = useState(false)

    const handleExport = (format) => {
        onExport(format)
        setIsOpen(false)
    }

    return (
        <div className="relative">
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className="flex items-center gap-2"
            >
                <Download className="h-4 w-4" />
                Xuất dữ liệu
                <ChevronDown className="h-4 w-4" />
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-20">
                        <div className="p-1">
                            <button
                                onClick={() => handleExport('excel')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-md"
                            >
                                📊 Xuất file excel (.xlsx)
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default function Events() {
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        schedule: 'all',
        status: 'all'
    })
    const [isExporting, setIsExporting] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const toast = useToast()
    const queryClient = useQueryClient()

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: eventService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['events'])
            toast.success('Xóa sự kiện thành công')
            setShowDetailModal(false)
            setSelectedEvent(null)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    // Event handlers
    const handleEventClick = (event) => {
        setSelectedEvent(event)
        setShowDetailModal(true)
    }

    const handleEditEvent = (event) => {
        setSelectedEvent(event)
        setShowDetailModal(false)
        setShowEditDialog(true)
    }

    const handleDeleteEvent = (event) => {
        if (confirm('Bạn có chắc muốn xóa sự kiện này?')) {
            deleteMutation.mutate(event.id)
        }
    }

    const closeDetailModal = () => {
        setShowDetailModal(false)
        setSelectedEvent(null)
    }

    const closeEditDialog = () => {
        setShowEditDialog(false)
        setSelectedEvent(null)
    }

    // Fetch events with filters
    const { data: eventsData = { data: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const params = {}
            if (filters.search) params.keyword = filters.search
            if (filters.category && filters.category !== 'all') params.category_id = filters.category
            if (filters.schedule && filters.schedule !== 'all') params.schedule_id = filters.schedule
            if (filters.status !== 'all') {
                const now = new Date().toISOString()
                if (filters.status === 'upcoming') {
                    params.start = now
                } else if (filters.status === 'past') {
                    params.end = now
                }
            }

            return eventService.getAll(params)
        },
        select: (data) => data.success ? { data: data.data, total: data.total || data.data.length } : { data: [], total: 0 }
    })

    // Fetch filter options
    const { data: schedules = [] } = useQuery({
        queryKey: ['schedules'],
        queryFn: () => scheduleService.getAll(),
        select: (data) => data.success ? data.data : []
    })

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
        select: (data) => data.success ? data.data : []
    })

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const handleClearFilters = () => {
        setFilters({
            search: '',
            category: '',
            schedule: '',
            status: 'all'
        })
    }

    // Handle export
    const handleExport = async (exportFormat) => {
        try {
            setIsExporting(true)

            const params = new URLSearchParams({
                format: exportFormat,
                ...(filters.category && { category_id: filters.category }),
                ...(filters.schedule && { schedule_id: filters.schedule })
            })

            const response = await api.get(`/export/events?${params}`, {
                responseType: 'blob'
            })

            // Check if response is an error (JSON)
            const contentType = response.headers['content-type']
            if (contentType && contentType.includes('application/json')) {
                const text = await response.data.text()
                const errorData = JSON.parse(text)
                throw new Error(errorData.message || 'Khong co su kien de xuat')
            }

            // Create download link
            const blob = new Blob([response.data])
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            // Set filename based on format
            const timestamp = format(new Date(), 'yyyy-MM-dd')
            if (exportFormat === 'excel') {
                link.download = `Danh_sach_su_kien_${timestamp}.xlsx`
            } else if (exportFormat === 'csv') {
                link.download = `Su_kien_${timestamp}.csv`
            } else {
                link.download = `events_${timestamp}.ics`
            }

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success(`Xuat ${exportFormat.toUpperCase()} thanh cong`)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Co loi khi xuat du lieu')
        } finally {
            setIsExporting(false)
        }
    }

    // Get active filter count
    const activeFilterCount = [
        filters.search,
        filters.category,
        filters.schedule,
        filters.status !== 'all' ? filters.status : ''
    ].filter(Boolean).length

    if (isLoading) {
        return <div className="flex justify-center py-20">Đang tải...</div>
    }

    return (
        <div className="space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-800">Danh sách sự kiện</h1>
                    <p className="text-secondary-500 mt-1">
                        Tổng cộng {eventsData.total} sự kiện
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={() => handleExport('excel')}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Dang xuat...' : 'Xuat Excel'}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="text-sm font-medium text-secondary-700 mb-1.5 block">
                                Tìm kiếm
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                                <Input
                                    placeholder="Tìm theo tiêu đề..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-sm font-medium text-secondary-700 mb-1.5 block">
                                Danh mục
                            </label>
                            <Select
                                value={filters.category}
                                onValueChange={(value) => handleFilterChange('category', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả danh mục</SelectItem>
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
                        </div>

                        {/* Schedule */}
                        <div>
                            <label className="text-sm font-medium text-secondary-700 mb-1.5 block">
                                Thời gian biểu
                            </label>
                            <Select
                                value={filters.schedule}
                                onValueChange={(value) => handleFilterChange('schedule', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả thời gian biểu" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả thời gian biểu</SelectItem>
                                    {schedules.map((schedule) => (
                                        <SelectItem key={schedule.id} value={schedule.id.toString()}>
                                            {schedule.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="text-sm font-medium text-secondary-700 mb-1.5 block">
                                Trạng thái
                            </label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => handleFilterChange('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="upcoming">Sắp tới</SelectItem>
                                    <SelectItem value="past">Đã qua</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Filter actions */}
                    {activeFilterCount > 0 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <span className="text-sm text-secondary-600">
                                Đang áp dụng {activeFilterCount} bộ lọc
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                                Xóa tất cả bộ lọc
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Events list */}
            {eventsData.data.length === 0 ? (
                <div className="text-center py-20">
                    <Calendar className="h-20 w-20 mx-auto text-secondary-300 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-800 mb-2">
                        Không tìm thấy sự kiện nào
                    </h3>
                    <p className="text-secondary-500">
                        {activeFilterCount > 0
                            ? 'Thử thay đổi bộ lọc để xem thêm sự kiện'
                            : 'Chưa có sự kiện nào được tạo'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {eventsData.data.map((event) => (
                        <EventCard key={event.id} event={event} onEventClick={handleEventClick} />
                    ))}
                </div>
            )}

            {/* Event Detail Modal */}
            <EventDetailModal
                event={selectedEvent}
                open={showDetailModal}
                onClose={closeDetailModal}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                isDeleting={deleteMutation.isPending}
            />

            {/* Edit Event Dialog */}
            <EventDialog
                open={showEditDialog}
                onClose={closeEditDialog}
                selectedEvent={selectedEvent}
                mode="edit"
            />
        </div>
    )
}
