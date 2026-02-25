import { useMemo } from 'react'
import type { Class } from '~/utils/classes'
import { DAYS_OF_WEEK } from '~/utils/classes'
import { ClassBlock } from './ClassBlock'

interface TimetableGridProps {
  classes: Class[]
  onClassClick: (classItem: Class) => void
  onAddClass: (dayOfWeek: number, hour: number) => void
  selectedClassId?: string
}

// Time range for the grid (7 AM to 9 PM)
const START_HOUR = 7
const END_HOUR = 21
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

// Parse time string (HH:MM or HH:MM:SS) to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number)
  return parts[0] * 60 + (parts[1] || 0)
}

// Calculate position and height for a class block
function getClassPosition(startTime: string, endTime: string) {
  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(endTime)

  // Calculate relative to our grid start (START_HOUR)
  const gridStartMinutes = START_HOUR * 60
  const gridEndMinutes = END_HOUR * 60
  const gridTotalMinutes = gridEndMinutes - gridStartMinutes

  const top = ((startMinutes - gridStartMinutes) / gridTotalMinutes) * 100
  const height = ((endMinutes - startMinutes) / gridTotalMinutes) * 100

  return {
    top: `${Math.max(0, top)}%`,
    height: `${Math.min(100 - top, height)}%`,
  }
}

// Format hour for display
function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour} ${period}`
}

export function TimetableGrid({
  classes,
  onClassClick,
  onAddClass,
  selectedClassId,
}: TimetableGridProps) {
  // Group classes by day of week
  const classesByDay = useMemo(() => {
    const grouped: Record<number, Class[]> = {}
    DAYS_OF_WEEK.forEach(day => {
      grouped[day.value] = []
    })

    classes.forEach(classItem => {
      classItem.days_of_week.forEach(dayNum => {
        if (grouped[dayNum]) {
          grouped[dayNum].push(classItem)
        }
      })
    })

    return grouped
  }, [classes])

  return (
    <div className="timetable-grid">
      {/* Header row with day names */}
      <div className="timetable-grid__header">
        <div className="timetable-grid__time-header" />
        {DAYS_OF_WEEK.map(day => (
          <div key={day.value} className="timetable-grid__day-header">
            <span className="timetable-grid__day-label">{day.short}</span>
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="timetable-grid__body">
        {/* Time column */}
        <div className="timetable-grid__time-column">
          {HOURS.map(hour => (
            <div key={hour} className="timetable-grid__time-slot">
              <span className="timetable-grid__time-label">{formatHour(hour)}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS_OF_WEEK.map(day => (
          <div key={day.value} className="timetable-grid__day-column">
            {/* Hour slots for clicking */}
            {HOURS.map(hour => (
              <button
                key={hour}
                type="button"
                className="timetable-grid__hour-slot"
                onClick={() => onAddClass(day.value, hour)}
                aria-label={`Add class on ${day.label} at ${formatHour(hour)}`}
              />
            ))}

            {/* Class blocks */}
            {classesByDay[day.value]?.map(classItem => {
              const position = getClassPosition(classItem.start_time, classItem.end_time)
              return (
                <ClassBlock
                  key={`${classItem.id}-${day.value}`}
                  classItem={classItem}
                  isSelected={selectedClassId === classItem.id}
                  onClick={() => onClassClick(classItem)}
                  style={position}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
