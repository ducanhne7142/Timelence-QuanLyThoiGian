import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, Calendar, X, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { eventService } from '@/services/eventService'
import { cn } from '@/utils/cn'

// Recent searches helper
const RECENT_SEARCHES_KEY = 'recent-searches'
const MAX_RECENT_SEARCHES = 5

const getRecentSearches = () => {
    try {
        return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
    } catch {
        return []
    }
}

const addRecentSearch = (query) => {
    if (!query.trim()) return

    const recent = getRecentSearches()
    const filtered = recent.filter(item => item !== query)
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES)

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}

const clearRecentSearches = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
}

function SearchResult({ event, isSelected, onClick }) {
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
        <button
            onClick={() => onClick(event)}
            className={cn(
                'w-full flex items-start gap-3 p-3 text-left rounded-lg transition-colors',
                isSelected ? 'bg-primary-50 border-primary' : 'hover:bg-secondary-50'
            )}
        >
            {/* Category indicator */}
            <div
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: eventColor }}
            />

            {/* Event details */}
            <div className="flex-1 min-w-0">
                <h4 className={cn(
                    'font-medium text-sm truncate',
                    isSelected ? 'text-primary-900' : 'text-secondary-800'
                )}>
                    {event.title}
                </h4>

                <div className="flex items-center gap-3 mt-1 text-xs text-secondary-500">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                            {event.all_day
                                ? 'Cả ngày'
                                : format(new Date(event.start_time), 'HH:mm dd/MM', { locale: vi })
                            }
                        </span>
                    </div>

                    {event.schedule_title && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="truncate">{event.schedule_title}</span>
                        </div>
                    )}
                </div>

                {event.category_name && (
                    <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-secondary-100 text-secondary-600">
                            {event.category_name}
                        </span>
                    </div>
                )}
            </div>

            {/* Arrow indicator */}
            <ArrowRight className={cn(
                'h-4 w-4 mt-0.5 flex-shrink-0',
                isSelected ? 'text-primary-600' : 'text-secondary-400'
            )} />
        </button>
    )
}

export default function SearchDialog({ open, onClose }) {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [recentSearches, setRecentSearches] = useState([])
    const inputRef = useRef(null)
    const navigate = useNavigate()

    // Load recent searches on mount
    useEffect(() => {
        setRecentSearches(getRecentSearches())
    }, [open])

    // Focus input when dialog opens
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus()
        }
    }, [open])

    // Search query with debounce
    const { data: searchResults = [], isLoading } = useQuery({
        queryKey: ['search-events', query],
        queryFn: () => {
            if (query.length === 0) {
                // Show recent events if no search query
                return eventService.getAll({ limit: 10 })
            }
            return eventService.search(query, { limit: 20 })
        },
        enabled: true, // Always enabled
        select: (data) => data.success ? data.data : [],
        staleTime: 30000 // Cache for 30 seconds
    })

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0)
    }, [searchResults])

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!open) return

            const resultsCount = searchResults.length

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex(prev => Math.min(prev + 1, resultsCount - 1))
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex(prev => Math.max(prev - 1, 0))
                    break
                case 'Enter':
                    e.preventDefault()
                    if (resultsCount > 0 && selectedIndex >= 0) {
                        handleSelectEvent(searchResults[selectedIndex])
                    }
                    break
                case 'Escape':
                    e.preventDefault()
                    onClose()
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open, searchResults, selectedIndex, onClose])

    const handleSelectEvent = (event) => {
        addRecentSearch(query)
        onClose()

        // Navigate to calendar with event highlighted
        navigate(`/calendar?event=${event.id}&date=${format(new Date(event.start_time), 'yyyy-MM-dd')}`)
    }

    const handleRecentSearchClick = (searchTerm) => {
        setQuery(searchTerm)
    }

    const handleClearRecent = () => {
        clearRecentSearches()
        setRecentSearches([])
    }

    const showRecent = !query && recentSearches.length > 0
    const showEmpty = !query && recentSearches.length === 0
    const showNoResults = query && !isLoading && searchResults.length === 0

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 gap-0">
                {/* Search input */}
                <div className="flex items-center gap-3 p-4 border-b">
                    <Search className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm kiếm sự kiện..."
                        className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-secondary-400"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 text-secondary-400 hover:text-secondary-600 rounded"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {/* Loading */}
                    {isLoading && (
                        <div className="p-8 text-center">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                            <p className="text-sm text-secondary-500">Đang tìm kiếm...</p>
                        </div>
                    )}

                    {/* Search Results */}
                    {!isLoading && searchResults.length > 0 && (
                        <div className="p-2">
                            <h3 className="text-xs font-medium text-secondary-500 uppercase tracking-wide px-3 py-2">
                                Kết quả tìm kiếm
                            </h3>
                            <div className="space-y-1">
                                {searchResults.map((event, index) => (
                                    <SearchResult
                                        key={event.id}
                                        event={event}
                                        isSelected={index === selectedIndex}
                                        onClick={handleSelectEvent}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Searches */}
                    {showRecent && (
                        <div className="p-2">
                            <div className="flex items-center justify-between px-3 py-2">
                                <h3 className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                                    Tìm kiếm gần đây
                                </h3>
                                <button
                                    onClick={handleClearRecent}
                                    className="text-xs text-secondary-400 hover:text-secondary-600"
                                >
                                    Xóa
                                </button>
                            </div>
                            <div className="space-y-1">
                                {recentSearches.map((searchTerm, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleRecentSearchClick(searchTerm)}
                                        className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-secondary-50 transition-colors"
                                    >
                                        <Clock className="h-4 w-4 text-secondary-400" />
                                        <span className="text-sm text-secondary-700">{searchTerm}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty States */}
                    {showEmpty && (
                        <div className="p-8 text-center">
                            <Search className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-secondary-800 mb-1">
                                Tìm kiếm sự kiện
                            </h3>
                            <p className="text-sm text-secondary-500">
                                Gõ từ khóa để tìm kiếm sự kiện trong lịch của bạn
                            </p>
                        </div>
                    )}

                    {showNoResults && (
                        <div className="p-8 text-center">
                            <Search className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-secondary-800 mb-1">
                                Không tìm thấy kết quả
                            </h3>
                            <p className="text-sm text-secondary-500">
                                Thử sử dụng từ khóa khác hoặc kiểm tra chính tả
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-3 bg-secondary-50">
                    <div className="flex items-center justify-between text-xs text-secondary-500">
                        <div className="flex items-center gap-4">
                            <span>↑↓ để điều hướng</span>
                            <span>↵ để chọn</span>
                            <span>esc để đóng</span>
                        </div>
                        {searchResults.length > 0 && (
                            <span>{searchResults.length} kết quả</span>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
