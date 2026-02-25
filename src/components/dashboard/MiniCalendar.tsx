import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

interface MiniCalendarProps {
  selectedDate?: Date | null
  onDateSelect?: (date: Date) => void
  eventDates?: string[] // Array of date strings in YYYY-MM-DD format
}

export function MiniCalendar({ selectedDate, onDateSelect, eventDates = [] }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate || new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  // Adjust to start week on Monday
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const isToday = (day: number) => {
    return today.getFullYear() === currentMonth.getFullYear() &&
           today.getMonth() === currentMonth.getMonth() &&
           today.getDate() === day
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return selectedDate.getFullYear() === currentMonth.getFullYear() &&
           selectedDate.getMonth() === currentMonth.getMonth() &&
           selectedDate.getDate() === day
  }

  const hasEvents = (day: number) => {
    const dateKey = formatDateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
    return eventDates.includes(dateKey)
  }

  const handleDayClick = (day: number) => {
    onDateSelect?.(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
  }

  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="dash-calendar__day dash-calendar__day--empty" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const classes = [
      'dash-calendar__day',
      isToday(day) && 'dash-calendar__day--today',
      isSelected(day) && 'dash-calendar__day--selected',
      hasEvents(day) && 'dash-calendar__day--has-events',
    ].filter(Boolean).join(' ')

    days.push(
      <button key={day} className={classes} onClick={() => handleDayClick(day)}>
        {day}
      </button>
    )
  }

  return (
    <div className="dash-calendar">
      <div className="dash-calendar__header">
        <h3 className="dash-calendar__month">{monthName}</h3>
        <div className="dash-calendar__nav">
          <button onClick={prevMonth} className="dash-calendar__nav-btn">
            <ChevronLeftIcon />
          </button>
          <button onClick={nextMonth} className="dash-calendar__nav-btn">
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      <div className="dash-calendar__weekdays">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="dash-calendar__weekday">{day}</div>
        ))}
      </div>
      <div className="dash-calendar__grid">
        {days}
      </div>
    </div>
  )
}
