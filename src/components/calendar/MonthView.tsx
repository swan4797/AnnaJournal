import { useMemo } from 'react'
import { getMonthDays, formatDateKey } from '~/utils/calendar'
import { EventBlock } from '~/components/events/EventBlock'
import type { Event } from '~/utils/events'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface MonthViewProps {
  events: Event[]
  exams?: Event[]
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
  currentYear: number
  currentMonth: number
  onMonthChange: (year: number, month: number) => void
}

export function MonthView({
  events,
  exams = [],
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

  // Get exams by date for showing badges
  const examsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()
    exams.forEach((exam) => {
      const dateKey = formatDateKey(new Date(exam.start_time))
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, exam])
    })
    return map
  }, [exams])

  // Calculate days until exam
  const getDaysUntilExam = (examDate: Date) => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const examStart = new Date(examDate)
    examStart.setHours(0, 0, 0, 0)
    const diffTime = examStart.getTime() - todayStart.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

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
          const dayExams = examsByDate.get(dateKey) || []
          const isSelected =
            selectedDate && formatDateKey(selectedDate) === dateKey
          const hasExam = dayExams.length > 0

          const cellClasses = [
            'month-view__cell',
            !day.isCurrentMonth && 'month-view__cell--other-month',
            isSelected && 'month-view__cell--selected',
            hasExam && 'month-view__cell--has-exam',
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
                {/* Exam badge */}
                {hasExam && (
                  <span className="month-view__exam-badge" title={dayExams[0].title}>
                    {getDaysUntilExam(new Date(dayExams[0].start_time)) === 0 ? '!' : getDaysUntilExam(new Date(dayExams[0].start_time)) + 'd'}
                  </span>
                )}
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
