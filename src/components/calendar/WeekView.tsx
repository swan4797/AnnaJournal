import { useMemo, useState, useEffect } from 'react'
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
  exams?: Event[]
  currentDate: Date
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
  onTimeSlotClick: (date: Date, hour: number) => void
}

const HOUR_HEIGHT = 60 // pixels per hour
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat']

export function WeekView({
  events,
  exams = [],
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

  // Current time tracking for the indicator line
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    return ((hours * 60 + minutes) / (24 * 60)) * 100 // Position as percentage of 24 hours
  }

  // Format current time for display
  const formatCurrentTime = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    return `${hours}:${String(minutes).padStart(2, '0')}`
  }

  // Check if current time line should show for this day
  const isCurrentTimeDay = (day: Date) => {
    return isSameDay(day, new Date())
  }

  // Create exam lookup map by ID for color coding linked sessions
  const examById = useMemo(() => {
    const map = new Map<string, Event>()
    exams.forEach(exam => map.set(exam.id, exam))
    return map
  }, [exams])

  // Get exam color index for consistent coloring
  const getExamColorIndex = (examId: string) => {
    const index = exams.findIndex(e => e.id === examId)
    return index >= 0 ? index % 5 : 0 // 5 colors available
  }

  // Calculate days until exam for countdown badge
  const getDaysUntilExam = (examDate: Date) => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const examStart = new Date(examDate)
    examStart.setHours(0, 0, 0, 0)
    const diffTime = examStart.getTime() - todayStart.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Get exams for a specific day
  const getExamsForDay = (day: Date) => {
    const dateKey = formatDateKey(day)
    return exams.filter(exam => formatDateKey(new Date(exam.start_time)) === dateKey)
  }

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
          const dayExams = getExamsForDay(day)

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`week-view__day-header ${isToday ? 'week-view__day-header--today' : ''} ${isSelected ? 'week-view__day-header--selected' : ''}`}
            >
              <span className="week-view__day-number">{day.getDate()}</span>
              <span className="week-view__day-separator">-</span>
              <span className="week-view__weekday">{DAY_NAMES[day.getDay()]}</span>
            </button>
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
            const showCurrentTime = isCurrentTimeDay(day)

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

                {/* Current time indicator */}
                {showCurrentTime && (
                  <div
                    className="week-view__current-time"
                    style={{ top: `${getCurrentTimePosition()}%` }}
                  >
                    <span className="week-view__current-time-label">{formatCurrentTime()}</span>
                    <div className="week-view__current-time-line" />
                  </div>
                )}

                {/* Events */}
                {dayTimedEvents.map((event) => {
                  const { top, height } = getEventPosition(event.start_time, event.end_time)
                  const linkedExam = event.linked_exam_id ? examById.get(event.linked_exam_id) : null
                  const examColorClass = linkedExam ? `week-view__event--exam-linked week-view__event--exam-${getExamColorIndex(event.linked_exam_id!)}` : ''
                  const category = getCategoryConfig(event.category)

                  // Format event time
                  const startTime = new Date(event.start_time)
                  const endTime = event.end_time ? new Date(event.end_time) : null
                  const timeStr = `${startTime.getHours()}:${String(startTime.getMinutes()).padStart(2, '0')}${startTime.getHours() >= 12 ? 'pm' : 'am'}${endTime ? ` - ${endTime.getHours()}:${String(endTime.getMinutes()).padStart(2, '0')}${endTime.getHours() >= 12 ? 'pm' : 'am'}` : ''}`

                  return (
                    <div
                      key={event.id}
                      className={`week-view__event event-card--${event.category} ${event.completed ? 'event-card--completed' : ''} ${examColorClass}`}
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        minHeight: '60px',
                      }}
                    >
                      <button
                        className="week-view__event-content"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                      >
                        <span className="week-view__event-title">
                          {linkedExam && <span className="week-view__event-exam-dot" />}
                          {event.title}
                        </span>
                        <span className="week-view__event-time">{timeStr}</span>
                      </button>

                      {/* Status badge and more button */}
                      <div className="week-view__event-footer">
                        {event.completed && (
                          <span className="week-view__event-status">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12" />
                            </svg>
                            Confirmed
                          </span>
                        )}
                        <button
                          className="week-view__event-more"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick(event)
                          }}
                          aria-label="More options"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="6" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="18" r="2" />
                          </svg>
                        </button>
                      </div>
                    </div>
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
