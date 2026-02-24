import { getCategoryConfig } from '~/utils/categories'
import { formatTime } from '~/utils/calendar'
import type { Event } from '~/utils/events'

interface EventBlockProps {
  event: Event
  compact?: boolean
  onClick?: (event: Event) => void
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
    event.completed && 'event-card--completed',
  ].filter(Boolean).join(' ')

  if (compact) {
    // Compact view for month calendar cells
    return (
      <button onClick={handleClick} className={classes}>
        <span>{category.icon}</span>
        {!event.all_day && event.start_time && (
          <span className="event-card__time">{formatTime(event.start_time)}</span>
        )}
        <span className="event-card__title">{event.title}</span>
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
