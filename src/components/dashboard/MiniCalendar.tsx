import { useState, useEffect, useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

export interface EventMarker {
  category: string
  count: number
}

export interface MonthEvents {
  [dateKey: string]: EventMarker[] // dateKey is YYYY-MM-DD
}

interface MiniCalendarProps {
  selectedDate?: Date | null
  onDateSelect?: (date: Date) => void
  onMonthChange?: (year: number, month: number) => void
  monthEvents?: MonthEvents
  isLoading?: boolean
}

// Category to background color mapping (pastel colors like design)
const getCategoryBgColor = (category: string): string => {
  const colors: Record<string, string> = {
    exam: '#FECACA',      // Coral/pink for exams
    homework: '#FEF3C7',  // Yellow for homework
    deadline: '#FED7AA',  // Orange-ish for deadlines
    task: '#E5E7EB',      // Gray for tasks
    lecture: '#DDD6FE',   // Light purple for lectures
    meeting: '#CFFAFE',   // Light cyan for meetings
    clinical: '#D1FAE5',  // Mint green for clinical
    study: '#E9D5FF',     // Light purple for study
    personal: '#FBCFE8',  // Light pink for personal
    reminder: '#D1FAE5',  // Mint green for reminders
  }
  return colors[category] || '#F3F4F6'
}

// Get the primary category color for a day with events
const getDayBgColor = (markers: EventMarker[]): string | null => {
  if (markers.length === 0) return null

  // Priority order for determining day background
  const priority = ['exam', 'deadline', 'homework', 'clinical', 'lecture', 'meeting', 'task', 'study', 'personal', 'reminder']
  const sorted = [...markers].sort((a, b) => {
    const aIdx = priority.indexOf(a.category)
    const bIdx = priority.indexOf(b.category)
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })

  return getCategoryBgColor(sorted[0].category)
}

export function MiniCalendar({
  selectedDate,
  onDateSelect,
  onMonthChange,
  monthEvents = {},
  isLoading = false,
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate || new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  // Adjust to start week on Monday
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const handleMonthChange = useCallback((newMonth: Date) => {
    setCurrentMonth(newMonth)
    onMonthChange?.(newMonth.getFullYear(), newMonth.getMonth())
  }, [onMonthChange])

  const prevMonth = () => {
    handleMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    handleMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Notify parent of initial month on mount
  useEffect(() => {
    onMonthChange?.(currentMonth.getFullYear(), currentMonth.getMonth())
  }, []) // Only on mount

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}-${String(day).padStart(2, '0')}`
  }

  const isToday = (day: number) => {
    return (
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getDate() === day
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getFullYear() === currentMonth.getFullYear() &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getDate() === day
    )
  }

  const getEventsForDay = (day: number): EventMarker[] => {
    const dateKey = formatDateKey(day)
    return monthEvents[dateKey] || []
  }

  const handleDayClick = (day: number) => {
    onDateSelect?.(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
  }

  const days = []

  // Empty cells for days before the start of the month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="dash-calendar__day dash-calendar__day--empty" />)
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const events = getEventsForDay(day)
    const hasEvents = events.length > 0
    const dayBgColor = hasEvents ? getDayBgColor(events) : null

    const classes = [
      'dash-calendar__day',
      isToday(day) && 'dash-calendar__day--today',
      isSelected(day) && 'dash-calendar__day--selected',
      hasEvents && 'dash-calendar__day--has-events',
    ]
      .filter(Boolean)
      .join(' ')

    days.push(
      <button
        key={day}
        className={classes}
        onClick={() => handleDayClick(day)}
        style={dayBgColor && !isToday(day) ? { backgroundColor: dayBgColor } : undefined}
      >
        <span className="dash-calendar__day-number">{day}</span>
        {hasEvents && events.length > 1 && (
          <span className="dash-calendar__event-count">+{events.length - 1}</span>
        )}
      </button>
    )
  }

  return (
    <div className={`dash-calendar ${isLoading ? 'dash-calendar--loading' : ''}`}>
      <div className="dash-calendar__header">
        <h3 className="dash-calendar__month">{monthName}</h3>
        <div className="dash-calendar__nav">
          <button onClick={prevMonth} className="dash-calendar__nav-btn" aria-label="Previous month">
            <ChevronLeftIcon />
          </button>
          <button onClick={nextMonth} className="dash-calendar__nav-btn" aria-label="Next month">
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="dash-calendar__weekdays">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="dash-calendar__weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="dash-calendar__grid">{days}</div>
    </div>
  )
}
