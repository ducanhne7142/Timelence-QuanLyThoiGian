import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Palette, Edit, Save, X } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import IconPicker from '@/components/ui/IconPicker'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'

// Default categories data
const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Study', name_vi: 'Học tập', color: '#3B82F6', icon: '📚', is_default: true },
    { id: 2, name: 'Work', name_vi: 'Công việc', color: '#EF4444', icon: '💼', is_default: true },
    { id: 3, name: 'Exercise', name_vi: 'Tập thể dục', color: '#10B981', icon: '🏃', is_default: true },
    { id: 4, name: 'Meal', name_vi: 'Ăn uống', color: '#F59E0B', icon: '🍽️', is_default: true },
    { id: 5, name: 'Sleep', name_vi: 'Ngủ nghỉ', color: '#8B5CF6', icon: '😴', is_default: true },
    { id: 6, name: 'Entertainment', name_vi: 'Giải trí', color: '#EC4899', icon: '🎮', is_default: true },
    { id: 7, name: 'Meeting', name_vi: 'Họp hành', color: '#06B6D4', icon: '👥', is_default: true },
    { id: 8, name: 'Other', name_vi: 'Khác', color: '#6B7280', icon: '📋', is_default: true }
]

const PRESET_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280',
    '#F97316', '#84CC16', '#14B8A6', '#A855F7'
]

// Category API service
const categoryAPI = {
    getAll: async () => {
        const response = await api.get('/admin/categories')
        return response.data
    },

    create: async (data) => {
        const response = await api.post('/admin/categories', data)
        return response.data
    },

    update: async (id, data) => {
        const response = await api.put(`/admin/categories/${id}`, data)
        return response.data
    },

    delete: async (id) => {
        const response = await api.delete(`/admin/categories/${id}`)
        return response.data
    }
}

// Category form dialog
function CategoryDialog({ category, open, onClose }) {
    const [formData, setFormData] = useState({
        name: category?.name || '',
        name_vi: category?.name_vi || '',
        color: category?.color || PRESET_COLORS[0],
        icon: category?.icon || '📋'
    })

    const toast = useToast()
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: categoryAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-categories'])
            toast.success(category ? 'Cập nhật danh mục thành công' : 'Tạo danh mục thành công')
            onClose()
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data) => categoryAPI.update(category.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-categories'])
            toast.success('Cập nhật danh mục thành công')
            onClose()
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (category) {
            updateMutation.mutate(formData)
        } else {
            createMutation.mutate(formData)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {category ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Tên tiếng Anh</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Study, Work, Exercise..."
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Tên tiếng Việt</label>
                        <Input
                            value={formData.name_vi}
                            onChange={(e) => setFormData(prev => ({ ...prev, name_vi: e.target.value }))}
                            placeholder="Học tập, Công việc, Tập thể dục..."
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Icon</label>
                        <IconPicker
                            value={formData.icon}
                            onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
                        />
                        <p className="text-xs text-secondary-500 mt-2">
                            Chọn emoji hoặc icon từ thư viện
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Màu sắc</label>
                        <div className="mt-2 flex gap-2 flex-wrap">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-400' : 'border-gray-200'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                />
                            ))}
                        </div>
                        <Input
                            className="mt-2"
                            value={formData.color}
                            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                            placeholder="#3B82F6"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="submit"
                            className="flex-1"
                            isLoading={createMutation.isLoading || updateMutation.isLoading}
                        >
                            {category ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// Main component
export default function CategoryManagement() {
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)

    const toast = useToast()
    const queryClient = useQueryClient()

    // Fetch categories
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: categoryAPI.getAll,
        select: (data) => data.success ? data.data : DEFAULT_CATEGORIES
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: categoryAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-categories'])
            toast.success('Xóa danh mục thành công')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Không thể xóa danh mục')
        }
    })

    const handleDelete = (category) => {
        if (category.is_default === 1 || category.is_default === true) {
            toast.error('Khong the xoa danh muc mac dinh')
            return
        }

        if (confirm(`Ban co chac muon xoa danh muc "${category.name_vi}"?`)) {
            deleteMutation.mutate(category.id)
        }
    }

    return (
        <div className="space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
                    <p className="text-gray-600">Quản lý các danh mục hoạt động và màu sắc mặc định</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo danh mục
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-8">Đang tải...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                                        style={{ backgroundColor: category.color + '20' }}
                                    >
                                        {(() => {
                                            // Check if it's an emoji (contains non-ASCII characters)
                                            if (/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(category.icon)) {
                                                return category.icon
                                            }
                                            // Otherwise, try to render as Lucide icon
                                            const IconComponent = LucideIcons[category.icon] || null
                                            return IconComponent ? (
                                                <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                                            ) : (
                                                <span>{category.icon}</span>
                                            )
                                        })()}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            {category.name_vi}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {category.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {category.is_default === 1 || category.is_default === true ? (
                                        <Badge variant="default">Mac dinh</Badge>
                                    ) : null}
                                    <div
                                        className="w-4 h-4 rounded-full border"
                                        style={{ backgroundColor: category.color }}
                                        title={category.color}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingCategory(category)}
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>

                                {category.is_default !== 1 && category.is_default !== true && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDelete(category)}
                                        isLoading={deleteMutation.isLoading}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <CategoryDialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
            />

            <CategoryDialog
                category={editingCategory}
                open={!!editingCategory}
                onClose={() => setEditingCategory(null)}
            />
        </div>
    )
}
