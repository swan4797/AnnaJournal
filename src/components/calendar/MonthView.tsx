import { useMemo } from 'react'
import { getMonthDays, formatDateKey } from '~/utils/calendar'
import { EventBlock } from '~/components/events/EventBlock'
import type { Event } from '~/utils/events'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface MonthViewProps {
  events: Event[]
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
  currentYear: number
  currentMonth: number
  onMonthChange: (year: number, month: number) => void
}

export function MonthView({
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  currentYear,
  currentMonth,
}: MonthViewProps) {
  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  // Group events by date for quick lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()
    events.forEach((event) => {
      const dateKey = formatDateKey(new Date(event.start_time))
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, event])
    })
    return map
  }, [events])

  return (
    <div className="month-view">
      {/* Weekday headers */}
      <div className="month-view__weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="month-view__weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="month-view__grid">
        {days.map((day, index) => {
          const dateKey = formatDateKey(day.date)
          const dayEvents = eventsByDate.get(dateKey) || []
          const isSelected =
            selectedDate && formatDateKey(selectedDate) === dateKey

          const cellClasses = [
            'month-view__cell',
            !day.isCurrentMonth && 'month-view__cell--other-month',
            isSelected && 'month-view__cell--selected',
          ].filter(Boolean).join(' ')

          return (
            <div
              key={index}
              onClick={() => onDateSelect(day.date)}
              className={cellClasses}
            >
              {/* Date number */}
              <div className="month-view__date">
                <span className={`month-view__date-number ${day.isToday ? 'month-view__date-number--today' : ''}`}>
                  {day.date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="month-view__events">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    compact
                    onClick={onEventClick}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <p className="month-view__more">
                    +{dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
