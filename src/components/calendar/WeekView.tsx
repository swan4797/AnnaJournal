import { useMemo } from 'react'
import {
  getWeekDays,
  formatDateKey,
  formatHour,
  getHoursOfDay,
  getEventPosition,
  isSameDay,
} from '~/utils/calendar'
import { getCategoryConfig } from '~/utils/categories'
import type { Event } from '~/utils/events'

interface WeekViewProps {
  events: Event[]
  currentDate: Date
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
  onTimeSlotClick: (date: Date, hour: number) => void
}

const HOUR_HEIGHT = 60 // pixels per hour

export function WeekView({
  events,
  currentDate,
  selectedDate,
  onDateSelect,
  onEventClick,
  onTimeSlotClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const hours = getHoursOfDay()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()
    events.forEach((event) => {
      const dateKey = formatDateKey(new Date(event.start_time))
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, event])
    })
    return map
  }, [events])

  // Separate all-day events
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: Map<string, Event[]> = new Map()
    const timed: Map<string, Event[]> = new Map()

    events.forEach((event) => {
      const dateKey = formatDateKey(new Date(event.start_time))
      if (event.all_day) {
        allDay.set(dateKey, [...(allDay.get(dateKey) || []), event])
      } else {
        timed.set(dateKey, [...(timed.get(dateKey) || []), event])
      }
    })

    return { allDayEvents: allDay, timedEvents: timed }
  }, [events])

  return (
    <div className="week-view">
      {/* Header with day names and dates */}
      <div className="week-view__header">
        {/* Time gutter */}
        <div className="week-view__gutter" />

        {/* Day headers */}
        {weekDays.map((day, index) => {
          const isToday = isSameDay(day, today)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <div key={index} className="week-view__day-header">
              <div className="week-view__weekday">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <button
                onClick={() => onDateSelect(day)}
                className={`week-view__date-btn ${isToday ? 'week-view__date-btn--today' : ''} ${isSelected ? 'week-view__date-btn--selected' : ''}`}
              >
                {day.getDate()}
              </button>
            </div>
          )
        })}
      </div>

      {/* All-day events section */}
      <div className="week-view__allday">
        <div className="week-view__gutter week-view__allday-label">All day</div>
        {weekDays.map((day, index) => {
          const dateKey = formatDateKey(day)
          const dayAllDayEvents = allDayEvents.get(dateKey) || []

          return (
            <div key={index} className="week-view__allday-cell">
              {dayAllDayEvents.map((event) => {
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`week-view__allday-event event-card--${event.category}`}
                  >
                    {event.title}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Scrollable time grid */}
      <div className="week-view__body">
        <div className="week-view__grid" style={{ height: hours.length * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="week-view__time-column">
            {hours.map((hour) => (
              <div
                key={hour}
                className="week-view__time-label"
                style={{ top: hour * HOUR_HEIGHT - 6 }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const dateKey = formatDateKey(day)
            const dayTimedEvents = timedEvents.get(dateKey) || []
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={dayIndex}
                className={`week-view__day-column ${isSelected ? 'week-view__day-column--selected' : ''}`}
              >
                {/* Hour lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="week-view__hour-slot"
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => onTimeSlotClick(day, hour)}
                  />
                ))}

                {/* Events */}
                {dayTimedEvents.map((event) => {
                  const { top, height } = getEventPosition(event.start_time, event.end_time)

                  return (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      className={`week-view__event event-card--${event.category} ${event.completed ? 'event-card--completed' : ''}`}
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        minHeight: '24px',
                      }}
                    >
                      <div className="week-view__event-title">{event.title}</div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
