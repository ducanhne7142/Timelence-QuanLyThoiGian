import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Reply, Tag, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'

// Status options
const FEEDBACK_STATUSES = [
    { value: 'pending', label: 'Chờ xử lý', color: 'warning', icon: Clock },
    { value: 'in_progress', label: 'Đang xử lý', color: 'info', icon: AlertCircle },
    { value: 'resolved', label: 'Đã giải quyết', color: 'success', icon: CheckCircle },
    { value: 'rejected', label: 'Đã từ chối', color: 'error', icon: AlertCircle }
]

// Category options
const FEEDBACK_CATEGORIES = [
    { value: 'bug', label: 'Báo lỗi' },
    { value: 'feature', label: 'Đề xuất tính năng' },
    { value: 'improvement', label: 'Cải thiện' },
    { value: 'question', label: 'Câu hỏi' },
    { value: 'other', label: 'Khác' }
]

// Feedback API service
const feedbackAPI = {
    getAll: async (params = {}) => {
        const response = await api.get('/admin/feedbacks', { params })
        return response.data
    },

    getById: async (id) => {
        const response = await api.get(`/admin/feedbacks/${id}`)
        return response.data
    },

    updateStatus: async (id, data) => {
        const response = await api.put(`/admin/feedbacks/${id}/status`, data)
        return response.data
    },

    reply: async (id, data) => {
        const response = await api.post(`/admin/feedbacks/${id}/reply`, data)
        return response.data
    },

    delete: async (id) => {
        const response = await api.delete(`/admin/feedbacks/${id}`)
        return response.data
    }
}

// Feedback details dialog
function FeedbackDetailsDialog({ feedback, open, onClose }) {
    const [replyMessage, setReplyMessage] = useState('')
    const [selectedStatus, setSelectedStatus] = useState(feedback?.status || 'pending')

    const toast = useToast()
    const queryClient = useQueryClient()

    const replyMutation = useMutation({
        mutationFn: (data) => feedbackAPI.reply(feedback.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-feedbacks'])
            toast.success('Đã gửi phản hồi')
            setReplyMessage('')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const statusMutation = useMutation({
        mutationFn: (data) => feedbackAPI.updateStatus(feedback.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-feedbacks'])
            toast.success('Đã cập nhật trạng thái')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const handleReply = () => {
        if (!replyMessage.trim()) {
            toast.error('Vui lòng nhập nội dung phản hồi')
            return
        }

        replyMutation.mutate({
            message: replyMessage,
            status: selectedStatus
        })
    }

    const handleStatusChange = (newStatus) => {
        setSelectedStatus(newStatus)
        statusMutation.mutate({ status: newStatus })
    }

    if (!feedback) return null

    const currentStatus = FEEDBACK_STATUSES.find(s => s.value === feedback.status)
    const StatusIcon = currentStatus?.icon || Clock

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Chi tiết phản hồi
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Feedback Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Người gửi</label>
                            <p className="mt-1">{feedback.user_name || 'Ẩn danh'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Email</label>
                            <p className="mt-1">{feedback.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Danh mục</label>
                            <p className="mt-1">
                                {FEEDBACK_CATEGORIES.find(c => c.value === feedback.category)?.label || feedback.category}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Ngày gửi</label>
                            <p className="mt-1">
                                {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">Trạng thái</label>
                        <div className="mt-2 flex items-center gap-4">
                            <Badge variant={currentStatus?.color} className="flex items-center gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {currentStatus?.label}
                            </Badge>

                            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FEEDBACK_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            <div className="flex items-center gap-2">
                                                <status.icon className="h-4 w-4" />
                                                {status.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Subject & Message */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">Tiêu đề</label>
                        <p className="mt-1 font-medium">{feedback.subject}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">Nội dung</label>
                        <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                            <p className="whitespace-pre-wrap">{feedback.message}</p>
                        </div>
                    </div>

                    {/* Previous Replies */}
                    {feedback.replies && feedback.replies.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-gray-600">Phản hồi trước đó</label>
                            <div className="mt-2 space-y-3">
                                {feedback.replies.map((reply, index) => (
                                    <div key={index} className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                                            <span>Admin</span>
                                            <span>{format(new Date(reply.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                                        </div>
                                        <p className="whitespace-pre-wrap">{reply.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reply Form */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">Phản hồi</label>
                        <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            className="mt-2 w-full min-h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập phản hồi của bạn..."
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            onClick={handleReply}
                            isLoading={replyMutation.isLoading}
                            className="flex items-center gap-2"
                        >
                            <Reply className="h-4 w-4" />
                            Gửi phản hồi
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            Đóng
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Main component
export default function FeedbackManagement() {
    const [selectedFeedback, setSelectedFeedback] = useState(null)
    const [filters, setFilters] = useState({
        status: 'all',
        category: 'all',
        search: ''
    })

    const toast = useToast()
    const queryClient = useQueryClient()

    // Fetch feedbacks
    const { data: feedbackData = {}, isLoading } = useQuery({
        queryKey: ['admin-feedbacks', filters],
        queryFn: () => {
            // Convert "all" values to empty strings for API
            const apiFilters = {
                ...filters,
                status: filters.status === 'all' ? '' : filters.status,
                category: filters.category === 'all' ? '' : filters.category
            }
            return feedbackAPI.getAll(apiFilters)
        },
        select: (data) => data.success ? data.data : { feedbacks: [], pagination: {} }
    })

    const { feedbacks = [], pagination = {} } = feedbackData

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: feedbackAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-feedbacks'])
            toast.success('Đã xóa phản hồi')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Không thể xóa phản hồi')
        }
    })

    const handleDelete = (feedback) => {
        if (confirm(`Bạn có chắc muốn xóa phản hồi "${feedback.subject}"?`)) {
            deleteMutation.mutate(feedback.id)
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = FEEDBACK_STATUSES.find(s => s.value === status)
        if (!statusConfig) return null

        const StatusIcon = statusConfig.icon

        return (
            <Badge variant={statusConfig.color} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
            </Badge>
        )
    }

    return (
        <div className="space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý phản hồi</h1>
                    <p className="text-gray-600">Xem và phản hồi các góp ý từ người dùng</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
                <Input
                    placeholder="Tìm kiếm theo tiêu đề, nội dung..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="max-w-xs"
                />

                <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        {FEEDBACK_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                    <status.icon className="h-4 w-4" />
                                    {status.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Lọc theo danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                        {FEEDBACK_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                                {category.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Feedbacks List */}
            {isLoading ? (
                <div className="text-center py-8">Đang tải...</div>
            ) : feedbacks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có phản hồi nào</h3>
                    <p className="text-gray-500">Các phản hồi từ người dùng sẽ hiển thị tại đây</p>
                </div>
            ) : (
                <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phản hồi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người gửi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Danh mục
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày gửi
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {feedbacks.map((feedback) => (
                                    <tr key={feedback.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {feedback.subject}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate max-w-md">
                                                    {feedback.message}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {feedback.user_name || 'Ẩn danh'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {feedback.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {FEEDBACK_CATEGORIES.find(c => c.value === feedback.category)?.label || feedback.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(feedback.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedFeedback(feedback)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(feedback)}
                                                    isLoading={deleteMutation.isLoading}
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Feedback Details Dialog */}
            <FeedbackDetailsDialog
                feedback={selectedFeedback}
                open={!!selectedFeedback}
                onClose={() => setSelectedFeedback(null)}
            />
        </div>
    )
}
