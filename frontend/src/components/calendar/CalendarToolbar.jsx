import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const viewLabels = {
    dayGridMonth: 'Tháng',
    timeGridWeek: 'Tuần',
    timeGridDay: 'Ngày'
}

export default function CalendarToolbar({
    currentView,
    title,
    onViewChange,
    onPrev,
    onNext,
    onToday,
    onAddEvent
}) {
    const views = ['dayGridMonth', 'timeGridWeek', 'timeGridDay']

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            {/* Left: Title and Navigation */}
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
                <h1 className="text-xl font-semibold text-secondary-800">
                    {title}
                </h1>
            </div>

            {/* Right: View Switcher and Add Event */}
            <div className="flex items-center gap-3">
                {/* View Switcher */}
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

                {/* Add Event Button */}
                <Button onClick={onAddEvent}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm sự kiện
                </Button>
            </div>
        </div>
    )
}
