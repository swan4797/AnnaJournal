import { useMemo } from 'react'
import {
  formatDateKey,
  formatHour,
  getHoursOfDay,
  getEventPosition,
  isSameDay,
} from '~/utils/calendar'
import { getCategoryConfig } from '~/utils/categories'
import type { Event } from '~/utils/events'

interface DayViewProps {
  events: Event[]
  currentDate: Date
  onEventClick: (event: Event) => void
  onTimeSlotClick: (date: Date, hour: number) => void
}

const HOUR_HEIGHT = 64 // pixels per hour

export function DayView({
  events,
  currentDate,
  onEventClick,
  onTimeSlotClick,
}: DayViewProps) {
  const hours = getHoursOfDay()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = isSameDay(currentDate, today)

  const dateKey = formatDateKey(currentDate)

  // Filter events for current day
  const dayEvents = useMemo(() => {
    return events.filter(
      (event) => formatDateKey(new Date(event.start_time)) === dateKey
    )
  }, [events, dateKey])

  // Separate all-day and timed events
  const { allDayEvents, timedEvents } = useMemo(() => {
    return {
      allDayEvents: dayEvents.filter((e) => e.all_day),
      timedEvents: dayEvents.filter((e) => !e.all_day),
    }
  }, [dayEvents])

  // Current time indicator position
  const currentTimePosition = useMemo(() => {
    if (!isToday) return null
    const now = new Date()
    const minutes = now.getHours() * 60 + now.getMinutes()
    return (minutes / (24 * 60)) * 100
  }, [isToday])

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="day-view">
      {/* Header */}
      <div className="day-view__header">
        <h2 className="day-view__title">{formattedDate}</h2>
        {isToday && <span className="day-view__today-badge">Today</span>}
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="day-view__allday">
          <div className="day-view__allday-label">All Day</div>
          <div className="day-view__allday-events">
            {allDayEvents.map((event) => {
              const category = getCategoryConfig(event.category)
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`day-view__allday-event event-card--${event.category}`}
                >
                  <span>{category.icon}</span>
                  <span>{event.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="day-view__body">
        <div className="day-view__grid" style={{ height: hours.length * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="day-view__time-column">
            {hours.map((hour) => (
              <div
                key={hour}
                className="day-view__time-label"
                style={{ top: hour * HOUR_HEIGHT - 8 }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="day-view__events-column">
            {/* Hour lines */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="day-view__hour-slot"
                style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                onClick={() => onTimeSlotClick(currentDate, hour)}
              >
                {/* Half-hour line */}
                <div className="day-view__half-hour" style={{ top: HOUR_HEIGHT / 2 }} />
              </div>
            ))}

            {/* Current time indicator */}
            {currentTimePosition !== null && (
              <div
                className="day-view__current-time"
                style={{ top: `${currentTimePosition}%` }}
              >
                <div className="day-view__current-time-dot" />
                <div className="day-view__current-time-line" />
              </div>
            )}

            {/* Events */}
            {timedEvents.map((event) => {
              const category = getCategoryConfig(event.category)
              const { top, height } = getEventPosition(event.start_time, event.end_time)

              return (
                <button
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                  className={`day-view__event event-card--${event.category} ${event.completed ? 'event-card--completed' : ''}`}
                  style={{
                    top: `${top}%`,
                    height: `${height}%`,
                    minHeight: '40px',
                  }}
                >
                  <span className="day-view__event-icon">{category.icon}</span>
                  <div className="day-view__event-content">
                    <div className="day-view__event-title">{event.title}</div>
                    {event.description && (
                      <div className="day-view__event-desc">{event.description}</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}