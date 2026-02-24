import { BookIcon, CalendarIcon } from './icons'

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

export function ExamsComingUp({ exams, onExamClick }: ExamsComingUpProps) {
  const getUrgencyClass = (daysUntil: number) => {
    if (daysUntil <= 2) return 'exams-list__item--urgent'
    if (daysUntil <= 7) return 'exams-list__item--soon'
    return ''
  }

  const formatDaysUntil = (days: number) => {
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `${days} days`
  }

  return (
    <div className="dashboard-card dashboard-card--exams">
      <div className="dashboard-card__header">
        <h3 className="dashboard-card__title">
          <BookIcon />
          Exams Coming Up
        </h3>
        <span className="dashboard-card__count">{exams.length} upcoming</span>
      </div>
      <div className="dashboard-card__content">
        {exams.length === 0 ? (
          <div className="dashboard-card__empty">
            <CalendarIcon />
            <span>No upcoming exams</span>
          </div>
        ) : (
          <ul className="exams-list">
            {exams.map((exam) => (
              <li
                key={exam.id}
                className={`exams-list__item ${getUrgencyClass(exam.daysUntil)}`}
                onClick={() => onExamClick?.(exam.id)}
              >
                <div className="exams-list__indicator" />
                <div className="exams-list__content">
                  <span className="exams-list__subject">{exam.subject}</span>
                  <div className="exams-list__meta">
                    <span className="exams-list__date">{exam.date}</span>
                    {exam.time && <span className="exams-list__time">{exam.time}</span>}
                  </div>
                </div>
                <span className="exams-list__countdown">
                  {formatDaysUntil(exam.daysUntil)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
