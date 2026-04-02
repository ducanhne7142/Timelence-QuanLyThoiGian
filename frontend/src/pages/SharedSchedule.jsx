import { useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { scheduleService } from '@/services/scheduleService'
import { cn } from '@/utils/cn'

// Helper function to get contrast color
const getContrastColor = (hexColor) => {
    if (!hexColor) return '#000000'

    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

function SharedCalendarToolbar({ currentView, title, onViewChange, onPrev, onNext, onToday }) {
    const viewLabels = {
        dayGridMonth: 'Tháng',
        timeGridWeek: 'Tuần',
        timeGridDay: 'Ngày'
    }

    const views = ['dayGridMonth', 'timeGridWeek', 'timeGridDay']

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            {/* Left: Navigation */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onPrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onToday}>
                        Hôm nay
                    </Button>
                </div>
                <h2 className="text-lg font-medium text-secondary-800">
                    {title}
                </h2>
            </div>

            {/* Right: View Switcher */}
            <div className="flex items-center bg-secondary-100 rounded-lg p-1">
                {views.map((view) => (
                    <button
                        key={view}
                        onClick={() => onViewChange(view)}
                        className={cn(
                            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                            currentView === view
                                ? 'bg-white text-secondary-800 shadow-sm'
                                : 'text-secondary-600 hover:text-secondary-800'
                        )}
                    >
                        {viewLabels[view]}
                    </button>
                ))}
            </div>
        </div>
    )
}

function EventDialog({ event, open, onClose }) {
    if (!event) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {event.category_color && (
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: event.category_color }}
                            />
                        )}
                        {event.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium text-secondary-800 mb-2">Thời gian</h4>
                        <p className="text-secondary-600">
                            {event.all_day ? 'Cả ngày' : (
                                <>
                                    {format(new Date(event.start_time), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                    {' - '}
                                    {format(new Date(event.end_time), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                </>
                            )}
                        </p>
                    </div>

                    {event.location && (
                        <div>
                            <h4 className="font-medium text-secondary-800 mb-2">Địa điểm</h4>
                            <p className="text-secondary-600">{event.location}</p>
                        </div>
                    )}

                    {event.description && (
                        <div>
                            <h4 className="font-medium text-secondary-800 mb-2">Mô tả</h4>
                            <p className="text-secondary-600 whitespace-pre-wrap">{event.description}</p>
                        </div>
                    )}

                    {event.category_name && (
                        <div>
                            <h4 className="font-medium text-secondary-800 mb-2">Danh mục</h4>
                            <div className="flex items-center gap-2">
                                {event.category_color && (
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: event.category_color }}
                                    />
                                )}
                                <span className="text-secondary-600">{event.category_name}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50">
            <div className="text-center">
                <Calendar className="h-20 w-20 mx-auto text-secondary-300 mb-4" />
                <h1 className="text-2xl font-bold text-secondary-800 mb-2">Không tìm thấy</h1>
                <p className="text-secondary-600 mb-6">
                    Link chia sẻ này không tồn tại hoặc đã bị vô hiệu hóa
                </p>
                <Link to="/register" className="text-primary hover:underline">
                    Tạo tài khoản để quản lý lịch của bạn
                </Link>
            </div>
        </div>
    )
}

export default function SharedSchedule() {
    const { token } = useParams()
    const [currentView, setCurrentView] = useState('dayGridMonth')
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showEventDialog, setShowEventDialog] = useState(false)
    const calendarRef = useRef(null)

    // Fetch shared schedule data
    const { data: scheduleData, isLoading, error } = useQuery({
        queryKey: ['shared-schedule', token],
        queryFn: async () => {
            console.log('Fetching shared schedule for token:', token)
            const result = await scheduleService.getShared(token)
            console.log('Shared schedule result:', result)
            return result
        },
        retry: false,
        onError: (error) => {
            console.error('Error fetching shared schedule:', error)
        }
    })

    // Transform events for FullCalendar
    const transformEvents = useCallback((events) => {
        if (!events) return []

        return events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start_time,
            end: event.end_time,
            allDay: event.all_day,
            backgroundColor: event.color || event.category_color || '#6B7280',
            borderColor: event.color || event.category_color || '#6B7280',
            textColor: getContrastColor(event.color || event.category_color || '#6B7280'),
            extendedProps: event
        }))
    }, [])

    // Calendar event handlers
    const handleEventClick = (info) => {
        setSelectedEvent(info.event.extendedProps)
        setShowEventDialog(true)
    }

    const handleViewChange = (view) => {
        setCurrentView(view)
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

    const getCurrentTitle = () => {
        if (calendarRef.current) {
            return calendarRef.current.getApi().view.title
        }
        return 'Lịch'
    }

    if (error) {
        return <NotFoundPage />
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-secondary-500">Đang tải lịch...</p>
                </div>
            </div>
        )
    }

    const { schedule, events } = scheduleData?.data || {}

    if (!schedule) {
        return <NotFoundPage />
    }

    return (
        <div className="min-h-screen bg-secondary-50">
            {/* Header */}
            <header className="bg-white border-b border-secondary-200 px-4 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-8 w-8 text-primary" />
                                <span className="text-lg font-bold text-primary">Schedule</span>
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-secondary-200" />
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-semibold text-secondary-800">{schedule.title}</h1>
                                <div className="flex items-center gap-2 text-sm text-secondary-500">
                                    <User className="h-4 w-4" />
                                    <span>Được tạo bởi {schedule.owner_name}</span>
                                </div>
                            </div>
                        </div>
                        <Link
                            to="/register"
                            className="text-primary hover:text-primary-600 text-sm font-medium"
                        >
                            Tạo lịch của bạn
                        </Link>
                    </div>

                    {/* Mobile header info */}
                    <div className="sm:hidden mt-3">
                        <h1 className="text-lg font-semibold text-secondary-800">{schedule.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-secondary-500">
                            <User className="h-4 w-4" />
                            <span>Được tạo bởi {schedule.owner_name}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4">
                {schedule.description && (
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <p className="text-secondary-700">{schedule.description}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-6">
                    <SharedCalendarToolbar
                        currentView={currentView}
                        title={getCurrentTitle()}
                        onViewChange={handleViewChange}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        onToday={handleToday}
                    />

                    {/* Calendar */}
                    <div className="bg-white rounded-lg border border-secondary-200 p-4">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView={currentView}
                            locale={viLocale}
                            firstDay={1}
                            headerToolbar={false}
                            height="auto"

                            // Read-only settings
                            editable={false}
                            selectable={false}

                            // Time settings
                            slotMinTime="06:00:00"
                            slotMaxTime="23:00:00"
                            slotDuration="00:30:00"
                            nowIndicator={true}

                            // Display
                            dayMaxEvents={3}
                            events={transformEvents(events)}

                            // Event handlers
                            eventClick={handleEventClick}

                            // Styling
                            dayHeaderFormat={{ weekday: 'short' }}
                            eventDisplay="block"
                            displayEventTime={true}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-secondary-200 mt-16">
                <div className="max-w-7xl mx-auto px-4 py-6 text-center">
                    <p className="text-secondary-500">
                        Được tạo bởi{' '}
                        <Link to="/" className="text-primary hover:underline font-medium">
                            Schedule App
                        </Link>
                    </p>
                    <p className="text-sm text-secondary-400 mt-1">
                        <Link to="/register" className="hover:text-primary">
                            Đăng ký miễn phí
                        </Link>
                        {' để tạo và quản lý lịch của bạn'}
                    </p>
                </div>
            </footer>

            {/* Event Dialog */}
            <EventDialog
                event={selectedEvent}
                open={showEventDialog}
                onClose={() => {
                    setShowEventDialog(false)
                    setSelectedEvent(null)
                }}
            />
        </div>
    )
}
