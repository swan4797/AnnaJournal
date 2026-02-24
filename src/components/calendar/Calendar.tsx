import { useState, useCallback } from 'react'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import { ViewSwitcher, type CalendarView } from './ViewSwitcher'
import {
  getMonthName,
  getPreviousMonth,
  getNextMonth,
  getPreviousWeek,
  getNextWeek,
  getWeekRange,
  getMonthRange,
} from '~/utils/calendar'
import type { Event } from '~/utils/events'

interface CalendarProps {
  events: Event[]
  selectedDate: Date | null
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
  onDateRangeChange: (start: string, end: string) => void
  onCreateEvent: (date: Date, hour?: number) => void
}

export function Calendar({
  events,
  selectedDate,
  currentView,
  onViewChange,
  onDateSelect,
  onEventClick,
  onDateRangeChange,
  onCreateEvent,
}: CalendarProps) {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(selectedDate || today)
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (currentView === 'month') {
      const prev = getPreviousMonth(currentYear, currentMonth)
      setCurrentYear(prev.year)
      setCurrentMonth(prev.month)
      const { start, end } = getMonthRange(prev.year, prev.month)
      onDateRangeChange(start, end)
    } else if (currentView === 'week') {
      const prev = getPreviousWeek(currentDate)
      setCurrentDate(prev)
      const { start, end } = getWeekRange(prev)
      onDateRangeChange(start, end)
    } else {
      const prev = new Date(currentDate)
      prev.setDate(currentDate.getDate() - 1)
      setCurrentDate(prev)
      onDateSelect(prev)
    }
  }, [currentView, currentYear, currentMonth, currentDate, onDateRangeChange, onDateSelect])

  const handleNext = useCallback(() => {
    if (currentView === 'month') {
      const next = getNextMonth(currentYear, currentMonth)
      setCurrentYear(next.year)
      setCurrentMonth(next.month)
      const { start, end } = getMonthRange(next.year, next.month)
      onDateRangeChange(start, end)
    } else if (currentView === 'week') {
      const next = getNextWeek(currentDate)
      setCurrentDate(next)
      const { start, end } = getWeekRange(next)
      onDateRangeChange(start, end)
    } else {
      const next = new Date(currentDate)
      next.setDate(currentDate.getDate() + 1)
      setCurrentDate(next)
      onDateSelect(next)
    }
  }, [currentView, currentYear, currentMonth, currentDate, onDateRangeChange, onDateSelect])

  const handleToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    onDateSelect(today)

    if (currentView === 'month') {
      const { start, end } = getMonthRange(today.getFullYear(), today.getMonth())
      onDateRangeChange(start, end)
    } else if (currentView === 'week') {
      const { start, end } = getWeekRange(today)
      onDateRangeChange(start, end)
    }
  }, [currentView, onDateSelect, onDateRangeChange])

  const handleDateSelect = useCallback(
    (date: Date) => {
      setCurrentDate(date)
      onDateSelect(date)
    },
    [onDateSelect]
  )

  const handleMonthChange = useCallback(
    (year: number, month: number) => {
      setCurrentYear(year)
      setCurrentMonth(month)
      const { start, end } = getMonthRange(year, month)
      onDateRangeChange(start, end)
    },
    [onDateRangeChange]
  )

  const handleTimeSlotClick = useCallback(
    (date: Date, hour: number) => {
      onCreateEvent(date, hour)
    },
    [onCreateEvent]
  )

  // Get display title based on view
  const getTitle = () => {
    if (currentView === 'month') {
      return `${getMonthName(currentMonth)} ${currentYear}`
    }
    if (currentView === 'week') {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${getMonthName(weekStart.getMonth())} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`
      }
      return `${getMonthName(weekStart.getMonth())} ${weekStart.getDate()} - ${getMonthName(weekEnd.getMonth())} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
    }
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="calendar">
      {/* Header */}
      <div className="calendar__header">
        <div className="calendar__header-left">
          <h2 className="calendar__title">{getTitle()}</h2>
          <button onClick={handleToday} className="calendar__today-btn">
            Today
          </button>
        </div>

        <div className="calendar__header-right">
          <ViewSwitcher currentView={currentView} onViewChange={onViewChange} />

          <div className="calendar__nav">
            <button
              onClick={handlePrev}
              className="calendar__nav-btn"
              aria-label="Previous"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="calendar__nav-btn"
              aria-label="Next"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="calendar__content">
        {currentView === 'month' && (
          <MonthView
            events={events}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventClick={onEventClick}
            currentYear={currentYear}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
          />
        )}

        {currentView === 'week' && (
          <WeekView
            events={events}
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventClick={onEventClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}

        {currentView === 'day' && (
          <DayView
            events={events}
            currentDate={currentDate}
            onEventClick={onEventClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}
      </div>
    </div>
  )
}
