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

  const formatDate = (date: string, daysUntil: number) => {
    if (daysUntil <= 7) {
      // Extract just the day for nearby dates
      const parts = date.split(' ')
      return parts[0] + ' ' + parts[1]
    }
    return date
  }

  return (
    <div className="upcoming">
      <h2 className="upcoming__title">Upcoming<span className="upcoming__dot">.</span></h2>

      <div className="upcoming__content">
        {exams.length === 0 ? (
          <div className="upcoming__empty">
            <CalendarIcon />
            <span>No upcoming exams</span>
          </div>
        ) : (
          <ul className="upcoming-list">
            {exams.map((exam, index) => (
              <li
                key={exam.id}
                className={`upcoming-list__item ${getUrgencyClass(exam.daysUntil)}`}
                onClick={() => onExamClick?.(exam.id)}
              >
                <div className={`upcoming-list__indicator upcoming-list__indicator--${getColorClass(index)}`} />
                <div className="upcoming-list__content">
                  <span className="upcoming-list__title">{exam.subject}</span>
                  <span className="upcoming-list__desc">
                    {exam.location || 'Carry out writing exams in school'}
                  </span>
                </div>
                <div className="upcoming-list__icon">
                  <DocumentIcon />
                </div>
                <div className="upcoming-list__time">
                  <span className="upcoming-list__date">{formatDate(exam.date, exam.daysUntil)}</span>
                  <span className="upcoming-list__duration">{formatDuration(index)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="upcoming__view-all">
        View all upcoming <ChevronRightSmallIcon />
      </button>
    </div>
  )
}

function ChevronRightSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}
