import { getCategoryConfig } from '~/utils/categories'
import { formatTime } from '~/utils/calendar'
import type { Event } from '~/utils/events'

interface EventBlockProps {
  event: Event
  compact?: boolean
  onClick?: (event: Event) => void
}

function ClockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function EventBlock({ event, compact = false, onClick }: EventBlockProps) {
  const category = getCategoryConfig(event.category)

  const handleClick = () => {
    if (onClick) {
      onClick(event)
    }
  }

  const classes = [
    'event-card',
    `event-card--${event.category}`,
    compact && 'event-card--compact',
    event.completed && 'event-card--completed',
  ].filter(Boolean).join(' ')

  if (compact) {
    // Compact view for month calendar cells
    return (
      <button onClick={handleClick} className={classes}>
        <span className="event-card__title">{event.title}</span>
        {!event.all_day && event.start_time && (
          <span className="event-card__time">
            <ClockIcon />
            {formatTime(event.start_time)} - {event.end_time ? formatTime(event.end_time) : ''}
          </span>
        )}
      </button>
    )
  }

  // Full view for sidebar or expanded views
  return (
    <button onClick={handleClick} className={classes}>
      <span>{category.icon}</span>
      <div>
        <div className="event-card__title">{event.title}</div>
        {!event.all_day && event.start_time && (
          <div className="event-card__time">
            {formatTime(event.start_time)}
            {event.end_time && ` - ${formatTime(event.end_time)}`}
          </div>
        )}
        {event.all_day && <div className="event-card__time">All day</div>}
        {event.priority === 'high' && (
          <span className="status-badge">High Priority</span>
        )}
      </div>
    </button>
  )
}
