// Calendar utility functions for date manipulation

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
}

/**
 * Get all days to display in a month view (includes padding days from prev/next months)
 */
export function getMonthDays(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // First day of the month
  const firstDay = new Date(year, month, 1)
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)

  // Day of week the month starts on (0 = Sunday)
  const startDayOfWeek = firstDay.getDay()

  // Add padding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
    })
  }

  // Add all days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
    })
  }

  // Add padding days from next month to complete the grid (6 rows × 7 days = 42)
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
    })
  }

  return days
}

/**
 * Format a date as YYYY-MM-DD for comparison
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get month name from month index
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month]
}

/**
 * Format time from ISO string (e.g., "14:30")
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Get start and end of month as ISO strings for querying
 */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) {
    return { year: year - 1, month: 11 }
  }
  return { year, month: month - 1 }
}

/**
 * Navigate to next month
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) {
    return { year: year + 1, month: 0 }
  }
  return { year, month: month + 1 }
}

/**
 * Get the week containing a specific date (Sun-Sat)
 */
export function getWeekDays(date: Date): Date[] {
  const days: Date[] = []
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    days.push(day)
  }

  return days
}

/**
 * Get start and end of week as ISO strings for querying
 */
export function getWeekRange(date: Date): { start: string; end: string } {
  const days = getWeekDays(date)
  const start = days[0]
  const end = new Date(days[6])
  end.setHours(23, 59, 59, 999)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

/**
 * Get hours array for day/week view (0-23)
 */
export function getHoursOfDay(): number[] {
  return Array.from({ length: 24 }, (_, i) => i)
}

/**
 * Format hour for display (e.g., "9 AM", "2 PM")
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

/**
 * Get the position of an event in a day view (top offset and height as percentages)
 */
export function getEventPosition(startTime: string, endTime: string | null): { top: number; height: number } {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60 * 1000) // Default 1 hour

  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const endMinutes = end.getHours() * 60 + end.getMinutes()
  const durationMinutes = Math.max(endMinutes - startMinutes, 30) // Minimum 30 min display

  const top = (startMinutes / (24 * 60)) * 100
  const height = (durationMinutes / (24 * 60)) * 100

  return { top, height }
}

/**
 * Navigate to previous week
 */
export function getPreviousWeek(date: Date): Date {
  const prev = new Date(date)
  prev.setDate(date.getDate() - 7)
  return prev
}

/**
 * Navigate to next week
 */
export function getNextWeek(date: Date): Date {
  const next = new Date(date)
  next.setDate(date.getDate() + 7)
  return next
}
