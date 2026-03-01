import { CalendarIcon, DocumentIcon } from './icons'

export interface Exam {
  id: string
  subject: string
  date: string
  time?: string
  location?: string
  daysUntil: number
}

interface ExamsComingUpProps {
  exams: Exam[]
  onExamClick?: (examId: string) => void
}

// Helper to get color class based on index
const getColorClass = (index: number) => {
  const colors = ['orange', 'blue', 'red', 'green', 'purple']
  return colors[index % colors.length]
}

// Helper to format duration
const formatDuration = (index: number) => {
  const durations = ['45 Minutes', '3 Hours', '50 Minutes', '2 Hours', '1 Hour']
  return durations[index % durations.length]
}

export function ExamsComingUp({ exams, onExamClick }: ExamsComingUpProps) {
  const getUrgencyClass = (daysUntil: number) => {
    if (daysUntil <= 2) return 'upcoming-list__item--urgent'
    if (daysUntil <= 7) return 'upcoming-list__item--soon'
    return ''
  }

  const formatDaysLeft = (daysUntil: number) => {
    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return '1 Day Left'
    return `${daysUntil} Days Left`
  }

  return (
    <div className="dashboard-card dashboard-card--exams">
      <div className="dashboard-card__header">
        <h3 className="dashboard-card__title">
          <CalendarIcon />
          Upcoming Exams
        </h3>
        <div className="dashboard-card__actions">
          <span className="dashboard-card__count">{exams.length}</span>
          <button type="button" className="dashboard-card__action-btn">
            <MoreIcon />
          </button>
        </div>
      </div>

      <div className="dashboard-card__content">
        {exams.length === 0 ? (
          <div className="dashboard-card__empty">
            <CalendarIcon />
            <span>No upcoming exams</span>
          </div>
        ) : (
          <ul className="upcoming-list">
            {exams.map((exam, index) => (
              <li key={exam.id}>
                <button
                  type="button"
                  className={`upcoming-list__item ${getUrgencyClass(exam.daysUntil)}`}
                  onClick={() => onExamClick?.(exam.id)}
                >
                  <div className={`upcoming-list__indicator upcoming-list__indicator--${getColorClass(index)}`} />
                  <div className="upcoming-list__content">
                    <span className="upcoming-list__title">{exam.subject}</span>
                    <span className="upcoming-list__desc">
                      {exam.location || 'Exam scheduled'}
                    </span>
                  </div>
                  <div className="upcoming-list__meta">
                    <span className="upcoming-list__date">{exam.date}</span>
                    <span className="upcoming-list__countdown">{formatDaysLeft(exam.daysUntil)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  )
}

function ChevronRightSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}
