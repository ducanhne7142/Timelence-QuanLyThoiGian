import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'
import { format } from 'date-fns'
import { Filter } from 'lucide-react'

import CalendarToolbar from '@/components/calendar/CalendarToolbar'
import EventDialog from '@/components/calendar/EventDialog'
import { QuickFilters, AdvancedFiltersDialog, FilterSummary } from '@/components/calendar/CalendarFilters'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { eventService } from '@/services/eventService'
import { categoryService } from '@/services/categoryService'

// Default category colors
const defaultCategoryColors = {
    1: '#3B82F6', // Study - Blue
    2: '#EF4444', // Work - Red
    3: '#10B981', // Exercise - Green
    4: '#F59E0B', // Meal - Amber
    5: '#8B5CF6', // Sleep - Purple
    6: '#EC4899', // Entertainment - Pink
    7: '#06B6D4', // Meeting - Cyan
    8: '#6B7280'  // Other - Gray
}

// Helper function to get contrast color
const getContrastColor = (hexColor) => {
    if (!hexColor) return '#000000'

    // Remove # if present
    const hex = hexColor.replace('#', '')

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

export default function Calendar() {
    const [currentView, setCurrentView] = useState(() => {
        return localStorage.getItem('calendar-view') || 'dayGridMonth'
    })
    const [selectedDate, setSelectedDate] = useState(null)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [dialogState, setDialogState] = useState({
        create: false,
        edit: false,
        view: false
    })
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [filters, setFilters] = useState({
        categories: [],
        schedules: [],
        dateRange: { from: '', to: '' },
        status: 'all'
    })

    const calendarRef = useRef(null)
    const toast = useToast()
    const queryClient = useQueryClient()

    // Fetch categories for colors
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
        select: (data) => data.success ? data.data : []
    })

    // Create category color map
    const categoryColors = categories.reduce((acc, category) => {
        acc[category.id] = category.color || defaultCategoryColors[category.id] || '#6B7280'
        return acc
    }, {})

    // Event mutation for drag & drop
    const moveEventMutation = useMutation({
        mutationFn: ({ id, start_time, end_time }) => {
            console.log('Moving event API call:', { id, start_time, end_time })
            return eventService.move(id, { start_time, end_time })
        },
        onSuccess: (data) => {
            console.log('Move event success:', data)
            queryClient.invalidateQueries(['events'])
            toast.success('Di chuyển sự kiện thành công')
        },
        onError: (error) => {
            console.error('Move event error:', error)
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi di chuyển sự kiện')
            // Revert calendar
            if (calendarRef.current) {
                calendarRef.current.getApi().refetchEvents()
            }
        }
    })

    // Fetch events function
    const fetchEvents = useCallback(async (fetchInfo) => {
        try {
            const response = await eventService.getAll({
                start: format(fetchInfo.start, 'yyyy-MM-dd'),
                end: format(fetchInfo.end, 'yyyy-MM-dd')
            })

            if (response.success) {
                let events = response.data

                // Apply category filter
                if (filters.categories.length > 0) {
                    events = events.filter(event => filters.categories.includes(event.category_id))
                }

                // Apply date range filter
                if (filters.dateRange.from) {
                    const fromDate = new Date(filters.dateRange.from)
                    events = events.filter(event => new Date(event.start_time) >= fromDate)
                }
                if (filters.dateRange.to) {
                    const toDate = new Date(filters.dateRange.to)
                    toDate.setHours(23, 59, 59, 999)
                    events = events.filter(event => new Date(event.start_time) <= toDate)
                }

                // Apply status filter
                if (filters.status === 'upcoming') {
                    events = events.filter(event => new Date(event.start_time) > new Date())
                } else if (filters.status === 'past') {
                    events = events.filter(event => new Date(event.end_time) < new Date())
                }

                return events.map(event => ({
                    id: event.id,
                    title: event.title,
                    start: event.start_time,
                    end: event.end_time,
                    allDay: event.all_day,
                    backgroundColor: event.color || categoryColors[event.category_id] || '#6B7280',
                    borderColor: event.color || categoryColors[event.category_id] || '#6B7280',
                    textColor: getContrastColor(event.color || categoryColors[event.category_id] || '#6B7280'),
                    extendedProps: {
                        ...event,
                        categoryColor: categoryColors[event.category_id]
                    }
                }))
            }
            return []
        } catch (error) {
            console.error('Error fetching events:', error)
            toast.error('Không thể tải sự kiện')
            return []
        }
    }, [categoryColors, toast, filters])

    // Refetch events when filters change
    useEffect(() => {
        if (calendarRef.current) {
            calendarRef.current.getApi().refetchEvents()
        }
    }, [filters])

    // Calendar event handlers
    const handleDateClick = (info) => {
        setSelectedDate(info.dateStr)
        setSelectedEvent(null)
        setDialogState({ create: true, edit: false, view: false })
    }

    const handleEventClick = (info) => {
        const event = info.event
        setSelectedEvent({
            id: event.id,
            title: event.title,
            start_time: event.start,
            end_time: event.end,
            all_day: event.allDay,
            ...event.extendedProps
        })
        setDialogState({ create: false, edit: false, view: true })
    }

    const handleSelect = (info) => {
        setSelectedDate(info.startStr)
        setSelectedEvent(null)
        setDialogState({ create: true, edit: false, view: false })
    }

    const handleEventDrop = (info) => {
        const { event } = info

        // Ensure end time exists, if not calculate it
        let endTime = event.end
        if (!endTime && event.start) {
            // If no end time, add 1 hour to start time
            endTime = new Date(event.start.getTime() + 60 * 60 * 1000)
        }

        console.log('Event drop:', {
            id: event.id,
            start: event.start?.toISOString(),
            end: endTime?.toISOString()
        })

        if (event.start && endTime) {
            moveEventMutation.mutate({
                id: event.id,
                start_time: event.start.toISOString(),
                end_time: endTime.toISOString()
            })
        }
    }

    const handleEventResize = (info) => {
        const { event } = info

        console.log('Event resize:', {
            id: event.id,
            start: event.start?.toISOString(),
            end: event.end?.toISOString()
        })

        if (event.start && event.end) {
            moveEventMutation.mutate({
                id: event.id,
                start_time: event.start.toISOString(),
                end_time: event.end.toISOString()
            })
        }
    }

    // Toolbar handlers
    const handleViewChange = (view) => {
        setCurrentView(view)
        localStorage.setItem('calendar-view', view)
        if (calendarRef.current) {
            calendarRef.current.getApi().changeView(view)
        }
    }

    const handlePrev = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().prev()
        }
    }

    const handleNext = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().next()
        }
    }

    const handleToday = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().today()
        }
    }

    const handleAddEvent = () => {
        setSelectedDate(null)
        setSelectedEvent(null)
        setDialogState({ create: true, edit: false, view: false })
    }

    // Dialog handlers
    const closeDialog = () => {
        setDialogState({ create: false, edit: false, view: false })
        setSelectedDate(null)
        setSelectedEvent(null)
    }

    const handleModeChange = (newMode) => {
        if (newMode === 'edit') {
            setDialogState({ create: false, edit: true, view: false })
        }
    }

    // Get current title
    const getCurrentTitle = () => {
        if (calendarRef.current) {
            return calendarRef.current.getApi().view.title
        }
        return 'Lịch'
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

            switch (e.key.toLowerCase()) {
                case 't':
                    handleToday()
                    break
                case 'd':
                    handleViewChange('timeGridDay')
                    break
                case 'w':
                    handleViewChange('timeGridWeek')
                    break
                case 'm':
                    handleViewChange('dayGridMonth')
                    break
                case 'arrowleft':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault()
                        handlePrev()
                    }
                    break
                case 'arrowright':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault()
                        handleNext()
                    }
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Filter handlers
    const handleCategoryChange = (selectedCategories) => {
        setFilters(prev => ({ ...prev, categories: selectedCategories }))
    }

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters)
    }

    const handleClearFilter = (type, id) => {
        if (type === 'category') {
            setFilters(prev => ({
                ...prev,
                categories: prev.categories.filter(catId => catId !== id)
            }))
        } else if (type === 'dateRange') {
            setFilters(prev => ({
                ...prev,
                dateRange: { from: '', to: '' }
            }))
        } else if (type === 'status') {
            setFilters(prev => ({ ...prev, status: 'all' }))
        }
    }

    const handleClearAllFilters = () => {
        setFilters({
            categories: [],
            schedules: [],
            dateRange: { from: '', to: '' },
            status: 'all'
        })
    }

    return (
        <div className="flex flex-col h-full relative -mt-4">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 via-blue-50/60 to-indigo-50/60 backdrop-blur-sm pointer-events-none" />
            {/* Custom Header */}
            <div className="relative z-10 transition-all duration-300" style={{ marginTop: '3.5rem' }}>
                <CalendarToolbar
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onToday={handleToday}
                    onAddEvent={handleAddEvent}
                    currentTitle={getCurrentTitle()}
                    className="border-b border-white/20 bg-white/80 backdrop-blur-md shadow-sm"
                />
            </div>

            {/* Filters */}
            <div className="p-4 bg-white/70 backdrop-blur-sm border-b border-white/20 relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <QuickFilters
                        categories={categories}
                        selectedCategories={filters.categories}
                        onCategoryChange={handleCategoryChange}
                    />

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvancedFilters(true)}
                            className="whitespace-nowrap"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Bộ lọc nâng cao
                        </Button>
                    </div>
                </div>

                <FilterSummary
                    filters={filters}
                    categories={categories}
                    onClearFilter={handleClearFilter}
                    onClearAll={handleClearAllFilters}
                />
            </div>

            {/* Calendar */}
            <div className="flex-1 p-6 overflow-hidden relative z-10">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={currentView}
                    locale={viLocale}

                    // Header
                    headerToolbar={false}
                    height="auto"

                    // Time settings
                    slotMinTime="06:00:00"
                    slotMaxTime="23:00:00"
                    slotDuration="00:30:00"
                    nowIndicator={true}

                    // Interaction
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={3}

                    // Events
                    events={fetchEvents}

                    // Event handlers
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    select={handleSelect}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventResize}

                    // Styling
                    dayHeaderFormat={{ weekday: 'short' }}
                    eventDisplay="block"
                    displayEventTime={true}

                    // View-specific settings  
                    views={{
                        dayGridMonth: {
                            dayMaxEvents: 3
                        },
                        timeGridWeek: {
                            slotLabelFormat: {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            }
                        },
                        timeGridDay: {
                            slotLabelFormat: {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            }
                        }
                    }}
                />
            </div>

            {/* Event Dialogs */}
            <EventDialog
                open={dialogState.create}
                onClose={closeDialog}
                selectedDate={selectedDate}
                mode="create"
            />

            <EventDialog
                open={dialogState.edit}
                onClose={closeDialog}
                selectedEvent={selectedEvent}
                mode="edit"
            />

            <EventDialog
                open={dialogState.view}
                onClose={closeDialog}
                selectedEvent={selectedEvent}
                mode="view"
                onModeChange={handleModeChange}
            />

            {/* Advanced Filters Dialog */}
            <AdvancedFiltersDialog
                open={showAdvancedFilters}
                onClose={() => setShowAdvancedFilters(false)}
                categories={categories}
                filters={filters}
                onFiltersChange={handleFiltersChange}
            />
        </div>
    )
}
