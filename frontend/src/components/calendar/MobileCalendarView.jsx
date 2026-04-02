import { useState, useEffect } from 'react'
import { format, addDays, subDays, startOfDay, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, MoreVertical } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { cn } from '@/utils/cn'

// Mobile month view with dots
function MobileMonthView({ events, selectedDate, onDateSelect, onEventClick }) {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate))

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Add padding days to make complete weeks
    const startDay = getDay(monthStart)
    const paddingStart = Array.from({ length: startDay }, (_, i) =>
        subDays(monthStart, startDay - i)
    )

    const allDays = [...paddingStart, ...calendarDays]

    const getEventsForDay = (day) => {
        return events.filter(event =>
            isSameDay(new Date(event.start), day)
        )
    }

    const nextMonth = () => setCurrentMonth(addDays(currentMonth, 32))
    const prevMonth = () => setCurrentMonth(subDays(currentMonth, 32))

    return (
        <div className="bg-white rounded-lg p-4">
            {/* Month header */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <h2 className="font-semibold text-lg">
                    {format(currentMonth, 'MMMM yyyy', { locale: vi })}
                </h2>

                <Button variant="ghost" size="sm" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {allDays.map((day, index) => {
                    const dayEvents = getEventsForDay(day)
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                    const isToday = isSameDay(day, new Date())
                    const isSelected = isSameDay(day, selectedDate)

                    return (
                        <button
                            key={index}
                            onClick={() => onDateSelect(day)}
                            className={cn(
                                "aspect-square p-1 text-sm rounded-lg transition-colors relative",
                                isCurrentMonth ? "text-gray-900" : "text-gray-400",
                                isToday && "bg-blue-100 text-blue-900 font-semibold",
                                isSelected && "bg-blue-600 text-white",
                                "hover:bg-gray-100"
                            )}
                        >
                            <span className="block">{day.getDate()}</span>

                            {/* Event dots */}
                            {dayEvents.length > 0 && (
                                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                                    {dayEvents.slice(0, 3).map((event, i) => (
                                        <div
                                            key={i}
                                            className="w-1 h-1 rounded-full"
                                            style={{ backgroundColor: event.color || '#3B82F6' }}
                                        />
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                                    )}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// Mobile day view
function MobileDayView({ events, selectedDate, onDateSelect, onEventClick }) {
    const dayEvents = events.filter(event =>
        isSameDay(new Date(event.start), selectedDate)
    ).sort((a, b) => new Date(a.start) - new Date(b.start))

    const nextDay = () => onDateSelect(addDays(selectedDate, 1))
    const prevDay = () => onDateSelect(subDays(selectedDate, 1))

    return (
        <div className="bg-white rounded-lg">
            {/* Day header */}
            <div className="flex items-center justify-between p-4 border-b">
                <Button variant="ghost" size="sm" onClick={prevDay}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-center">
                    <h2 className="font-semibold">
                        {format(selectedDate, 'EEEE', { locale: vi })}
                    </h2>
                    <p className="text-sm text-gray-600">
                        {format(selectedDate, 'dd/MM/yyyy')}
                    </p>
                </div>

                <Button variant="ghost" size="sm" onClick={nextDay}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Events list */}
            <div className="p-4 space-y-3">
                {dayEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Không có sự kiện nào</p>
                    </div>
                ) : (
                    dayEvents.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg active:bg-gray-100 transition-colors"
                        >
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                                style={{ backgroundColor: event.color || '#3B82F6' }}
                            />

                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">
                                    {event.title}
                                </h3>

                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>
                                        {event.allDay
                                            ? 'Cả ngày'
                                            : `${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')}`
                                        }
                                    </span>
                                </div>

                                {event.location && (
                                    <div className="flex items-center text-sm text-gray-600 mt-1">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                )}

                                {event.categoryName && (
                                    <Badge variant="secondary" className="mt-2">
                                        {event.categoryName}
                                    </Badge>
                                )}
                            </div>

                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// Event detail bottom sheet
function EventBottomSheet({ event, open, onClose, onEdit, onDelete }) {
    if (!event) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 m-4 rounded-t-xl">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="text-left">{event.title}</DialogTitle>
                </DialogHeader>

                <div className="px-4 pb-4 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                            {event.allDay
                                ? 'Cả ngày'
                                : `${format(new Date(event.start), 'HH:mm dd/MM/yyyy')} - ${format(new Date(event.end), 'HH:mm dd/MM/yyyy')}`
                            }
                        </span>
                    </div>

                    {event.location && (
                        <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{event.location}</span>
                        </div>
                    )}

                    {event.description && (
                        <div className="text-sm text-gray-700">
                            <p className="font-medium mb-1">Mô tả:</p>
                            <p>{event.description}</p>
                        </div>
                    )}

                    {event.categoryName && (
                        <Badge
                            style={{ backgroundColor: event.color }}
                            className="text-white"
                        >
                            {event.categoryName}
                        </Badge>
                    )}
                </div>

                <div className="flex border-t">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-none border-r"
                        onClick={() => {
                            onEdit(event)
                            onClose()
                        }}
                    >
                        Sửa
                    </Button>
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-none text-red-600"
                        onClick={() => {
                            onDelete(event)
                            onClose()
                        }}
                    >
                        Xóa
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Floating Action Button
function FAB({ onClick }) {
    return (
        <Button
            onClick={onClick}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
            size="lg"
        >
            <Plus className="h-6 w-6" />
        </Button>
    )
}

// Main mobile calendar component
export default function MobileCalendarView({
    events,
    selectedDate,
    onDateSelect,
    onEventClick,
    onEventEdit,
    onEventDelete,
    onAddEvent,
    view = 'month' // 'month' | 'day'
}) {
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showBottomSheet, setShowBottomSheet] = useState(false)

    const handleEventClick = (event) => {
        setSelectedEvent(event)
        setShowBottomSheet(true)
        onEventClick?.(event)
    }

    const handleEdit = (event) => {
        onEventEdit?.(event)
    }

    const handleDelete = (event) => {
        if (window.confirm('Bạn có chắc muốn xóa sự kiện này?')) {
            onEventDelete?.(event)
        }
    }

    return (
        <>
            {view === 'month' ? (
                <MobileMonthView
                    events={events}
                    selectedDate={selectedDate}
                    onDateSelect={onDateSelect}
                    onEventClick={handleEventClick}
                />
            ) : (
                <MobileDayView
                    events={events}
                    selectedDate={selectedDate}
                    onDateSelect={onDateSelect}
                    onEventClick={handleEventClick}
                />
            )}

            <EventBottomSheet
                event={selectedEvent}
                open={showBottomSheet}
                onClose={() => setShowBottomSheet(false)}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <FAB onClick={onAddEvent} />
        </>
    )
}
