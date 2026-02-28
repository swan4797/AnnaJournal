import { type Event } from '~/utils/events'

export interface CalendarEvent {
  id: string
  title: string
  time?: string
  category: string
  completed: boolean
}

interface DayEventsModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  events: CalendarEvent[]
  onToggleComplete: (eventId: string) => void
}

// Get category color
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    exam: '#EF4444',
    homework: '#F59E0B',
    deadline: '#F97316',
    task: '#3B82F6',
    lecture: '#8B5CF6',
    meeting: '#06B6D4',
    reminder: '#10B981',
  }
  return colors[category] || '#6B7280'
}

// Get category label
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    exam: 'Exam',
    homework: 'Homework',
    deadline: 'Deadline',
    task: 'Task',
    lecture: 'Lecture',
    meeting: 'Meeting',
    reminder: 'Reminder',
  }
  return labels[category] || 'Event'
}

// Format date for display
const formatDateHeader = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DayEventsModal({
  isOpen,
  onClose,
  date,
  events,
  onToggleComplete,
}: DayEventsModalProps) {
  if (!isOpen || !date) return null

  const sortedEvents = [...events].sort((a, b) => {
    // Sort by time if available, otherwise by category priority
    if (a.time && b.time) return a.time.localeCompare(b.time)
    if (a.time && !b.time) return -1
    if (!a.time && b.time) return 1

    // Priority: exam > deadline > homework > task
    const priority: Record<string, number> = { exam: 0, deadline: 1, homework: 2, task: 3 }
    return (priority[a.category] ?? 4) - (priority[b.category] ?? 4)
  })

  return (
    <div className="day-events-modal">
      <div className="day-events-modal__backdrop" onClick={onClose} />

      <div className="day-events-modal__content">
        <div className="day-events-modal__header">
          <div className="day-events-modal__date-info">
            <CalendarIcon />
            <h2 className="day-events-modal__title">{formatDateHeader(date)}</h2>
          </div>
          <button className="day-events-modal__close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="day-events-modal__body">
          {sortedEvents.length === 0 ? (
            <div className="day-events-modal__empty">
              <EmptyIcon />
              <p className="day-events-modal__empty-title">No tasks for this day</p>
              <p className="day-events-modal__empty-text">
                You have no scheduled tasks or events on this date.
              </p>
            </div>
          ) : (
            <div className="day-events-modal__list">
              <p className="day-events-modal__count">
                {sortedEvents.length} {sortedEvents.length === 1 ? 'task' : 'tasks'}
              </p>

              {sortedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`day-events-modal__event ${event.completed ? 'day-events-modal__event--completed' : ''}`}
                >
                  <button
                    className="day-events-modal__checkbox"
                    onClick={() => onToggleComplete(event.id)}
                    style={{
                      borderColor: getCategoryColor(event.category),
                      backgroundColor: event.completed ? getCategoryColor(event.category) : 'transparent',
                    }}
                  >
                    {event.completed && <CheckIcon />}
                  </button>

                  <div className="day-events-modal__event-content">
                    <span className="day-events-modal__event-title">{event.title}</span>
                    <div className="day-events-modal__event-meta">
                      <span
                        className="day-events-modal__event-category"
                        style={{ backgroundColor: `${getCategoryColor(event.category)}15`, color: getCategoryColor(event.category) }}
                      >
                        {getCategoryLabel(event.category)}
                      </span>
                      {event.time && (
                        <span className="day-events-modal__event-time">
                          <ClockIcon />
                          {event.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Transform Event to CalendarEvent
export function transformEventToCalendarEvent(event: Event): CalendarEvent {
  const eventDate = new Date(event.start_time)
  const time = event.all_day
    ? undefined
    : eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return {
    id: event.id,
    title: event.title,
    time,
    category: event.category || 'task',
    completed: event.completed || false,
  }
}

// Icons
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function EmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
