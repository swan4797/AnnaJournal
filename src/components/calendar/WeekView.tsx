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
  exams?: Event[]
  currentDate: Date
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
  onTimeSlotClick: (date: Date, hour: number) => void
}

const HOUR_HEIGHT = 60 // pixels per hour

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
              {/* Exam countdown badges */}
              {dayExams.length > 0 && (
                <div className="week-view__exam-badges">
                  {dayExams.slice(0, 2).map((exam, i) => {
                    const daysUntil = getDaysUntilExam(new Date(exam.start_time))
                    return (
                      <button
                        key={exam.id}
                        className={`week-view__exam-badge week-view__exam-badge--${getExamColorIndex(exam.id)}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(exam)
                        }}
                        title={exam.title}
                      >
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? '1d' : `${daysUntil}d`}
                      </button>
                    )
                  })}
                </div>
              )}
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
                  const linkedExam = event.linked_exam_id ? examById.get(event.linked_exam_id) : null
                  const examColorClass = linkedExam ? `week-view__event--exam-linked week-view__event--exam-${getExamColorIndex(event.linked_exam_id!)}` : ''

                  return (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      className={`week-view__event event-card--${event.category} ${event.completed ? 'event-card--completed' : ''} ${examColorClass}`}
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        minHeight: '24px',
                      }}
                    >
                      <div className="week-view__event-title">
                        {linkedExam && <span className="week-view__event-exam-dot" />}
                        {event.title}
                      </div>
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
