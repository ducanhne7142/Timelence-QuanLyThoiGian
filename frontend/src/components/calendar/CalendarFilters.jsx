import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, X, Calendar, Tag } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { scheduleService } from '@/services/scheduleService'
import { categoryService } from '@/services/categoryService'
import { cn } from '@/utils/cn'

// Quick filter chips component
export function QuickFilters({ selectedCategories, onCategoryChange }) {
    // Fetch categories from API
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
        select: (data) => data.success ? data.data : []
    })

    const handleChipClick = (categoryId) => {
        if (categoryId === 'all') {
            onCategoryChange([])
        } else {
            const isSelected = selectedCategories.includes(categoryId)
            if (isSelected) {
                onCategoryChange(selectedCategories.filter(id => id !== categoryId))
            } else {
                onCategoryChange([...selectedCategories, categoryId])
            }
        }
    }

    return (
        <div className="flex items-center gap-3 pb-4 border-b border-secondary-200">
            <div className="flex items-center gap-2 text-sm text-secondary-600">
                <Filter className="h-4 w-4" />
                <span>Loc nhanh:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
                {/* All option */}
                <button
                    onClick={() => handleChipClick('all')}
                    className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                        selectedCategories.length === 0
                            ? 'text-white shadow-sm bg-secondary-600'
                            : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                    )}
                >
                    Tat ca
                </button>

                {/* Category options from API */}
                {categories.map((category) => {
                    const isActive = selectedCategories.includes(category.id)

                    return (
                        <button
                            key={category.id}
                            onClick={() => handleChipClick(category.id)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                                isActive
                                    ? 'text-white shadow-sm'
                                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                            )}
                            style={isActive ? { backgroundColor: category.color } : undefined}
                        >
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: isActive ? 'currentColor' : category.color }}
                            />
                            {category.name_vi || category.name}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// Advanced filters dialog
export function AdvancedFiltersDialog({
    open,
    onClose,
    filters,
    onFiltersChange
}) {
    const [localFilters, setLocalFilters] = useState(filters)

    // Fetch data for dropdowns
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

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }))
    }

    const handleApply = () => {
        onFiltersChange(localFilters)
        onClose()
    }

    const handleReset = () => {
        const resetFilters = {
            categories: [],
            schedules: [],
            dateRange: { from: '', to: '' },
            status: 'all'
        }
        setLocalFilters(resetFilters)
        onFiltersChange(resetFilters)
        onClose()
    }

    // Get active filter count
    const getActiveFilterCount = () => {
        let count = 0
        if (localFilters.categories.length > 0) count++
        if (localFilters.schedules.length > 0) count++
        if (localFilters.dateRange.from || localFilters.dateRange.to) count++
        if (localFilters.status !== 'all') count++
        return count
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Bộ lọc nâng cao
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                        <h4 className="font-medium text-secondary-800 mb-3">Lọc theo danh mục</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((category) => (
                                <label
                                    key={category.id}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={localFilters.categories.includes(category.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                handleFilterChange('categories', [...localFilters.categories, category.id])
                                            } else {
                                                handleFilterChange('categories', localFilters.categories.filter(id => id !== category.id))
                                            }
                                        }}
                                        className="w-4 h-4 text-primary border-secondary-300 rounded focus:ring-primary"
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: category.color }}
                                        />
                                        <span className="text-sm text-secondary-700">{category.name_vi || category.name}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Schedule Filter */}
                    <div>
                        <h4 className="font-medium text-secondary-800 mb-3">Lọc theo thời gian biểu</h4>
                        <Select
                            value={localFilters.schedules.length > 0 ? localFilters.schedules[0]?.toString() : ''}
                            onValueChange={(value) => {
                                handleFilterChange('schedules', value ? [parseInt(value)] : [])
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn thời gian biểu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Tất cả thời gian biểu</SelectItem>
                                {schedules.map((schedule) => (
                                    <SelectItem key={schedule.id} value={schedule.id.toString()}>
                                        {schedule.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <h4 className="font-medium text-secondary-800 mb-3">Lọc theo ngày</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm text-secondary-600">Từ ngày</label>
                                <input
                                    type="date"
                                    value={localFilters.dateRange.from}
                                    onChange={(e) => handleFilterChange('dateRange', {
                                        ...localFilters.dateRange,
                                        from: e.target.value
                                    })}
                                    className="mt-1 w-full px-3 py-2 border border-secondary-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-secondary-600">Đến ngày</label>
                                <input
                                    type="date"
                                    value={localFilters.dateRange.to}
                                    onChange={(e) => handleFilterChange('dateRange', {
                                        ...localFilters.dateRange,
                                        to: e.target.value
                                    })}
                                    className="mt-1 w-full px-3 py-2 border border-secondary-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Quick date options */}
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => handleFilterChange('dateRange', {
                                    from: new Date().toISOString().split('T')[0],
                                    to: new Date().toISOString().split('T')[0]
                                })}
                                className="px-2 py-1 text-xs bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200"
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={() => {
                                    const today = new Date()
                                    const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1))
                                    const sunday = new Date(today.setDate(today.getDate() - today.getDay() + 7))
                                    handleFilterChange('dateRange', {
                                        from: monday.toISOString().split('T')[0],
                                        to: sunday.toISOString().split('T')[0]
                                    })
                                }}
                                className="px-2 py-1 text-xs bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200"
                            >
                                Tuần này
                            </button>
                            <button
                                onClick={() => {
                                    const today = new Date()
                                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                                    handleFilterChange('dateRange', {
                                        from: firstDay.toISOString().split('T')[0],
                                        to: lastDay.toISOString().split('T')[0]
                                    })
                                }}
                                className="px-2 py-1 text-xs bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200"
                            >
                                Tháng này
                            </button>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <h4 className="font-medium text-secondary-800 mb-3">Lọc theo trạng thái</h4>
                        <Select
                            value={localFilters.status}
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

                {/* Actions */}
                <div className="flex justify-between pt-6">
                    <Button variant="ghost" onClick={handleReset}>
                        Xóa bộ lọc
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button onClick={handleApply}>
                            Áp dụng {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Filter summary component
export function FilterSummary({ filters, onClearFilter, onClearAll }) {
    // Fetch categories from API
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
        select: (data) => data.success ? data.data : []
    })

    const activeFilters = []

    // Category filters
    filters.categories.forEach(categoryId => {
        const category = categories.find(cat => cat.id === categoryId)
        if (category) {
            activeFilters.push({
                type: 'category',
                id: categoryId,
                label: category.name_vi || category.name,
                color: category.color
            })
        }
    })

    // Date range filter
    if (filters.dateRange?.from || filters.dateRange?.to) {
        activeFilters.push({
            type: 'dateRange',
            id: 'dateRange',
            label: `${filters.dateRange.from || '...'} - ${filters.dateRange.to || '...'}`
        })
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
        const statusLabels = {
            upcoming: 'Sap toi',
            past: 'Da qua'
        }
        activeFilters.push({
            type: 'status',
            id: 'status',
            label: statusLabels[filters.status]
        })
    }

    if (activeFilters.length === 0) return null

    return (
        <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-secondary-600">Dang loc:</span>
            <div className="flex items-center gap-2">
                {activeFilters.map((filter) => (
                    <div
                        key={filter.id}
                        className="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                    >
                        {filter.color && (
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: filter.color }}
                            />
                        )}
                        <span>{filter.label}</span>
                        <button
                            onClick={() => onClearFilter(filter.type, filter.id)}
                            className="ml-1 hover:text-primary-900"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                <button
                    onClick={onClearAll}
                    className="text-sm text-secondary-500 hover:text-secondary-700"
                >
                    Xoa tat ca
                </button>
            </div>
        </div>
    )
}
