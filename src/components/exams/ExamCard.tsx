import type { Event } from '~/utils/events'
import { getCategoryConfig } from '~/utils/categories'

interface ExamCardProps {
  exam: Event
  isSelected: boolean
  onClick: () => void
}

export function ExamCard({ exam, isSelected, onClick }: ExamCardProps) {
  const category = getCategoryConfig(exam.category)
  const examDate = new Date(exam.start_time)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const getUrgencyClass = () => {
    if (daysUntil <= 0) return 'exam-card--past'
    if (daysUntil <= 2) return 'exam-card--urgent'
    if (daysUntil <= 7) return 'exam-card--soon'
    return ''
  }

  const formatDaysUntil = () => {
    if (daysUntil < 0) return 'Past'
    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return 'Tomorrow'
    return `${daysUntil} days`
  }

  const formatDate = () => {
    return examDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = () => {
    if (exam.all_day) return 'All day'
    return examDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <button
      className={`exam-card ${getUrgencyClass()} ${isSelected ? 'exam-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="exam-card__indicator" />
      <div className="exam-card__content">
        <div className="exam-card__header">
          <span className="exam-card__icon">{category.icon}</span>
          <span className="exam-card__countdown">{formatDaysUntil()}</span>
        </div>
        <h3 className="exam-card__title">{exam.title}</h3>
        <div className="exam-card__meta">
          <span className="exam-card__date">{formatDate()}</span>
          <span className="exam-card__time">{formatTime()}</span>
        </div>
        {exam.description && (
          <p className="exam-card__location">{exam.description}</p>
        )}
        {exam.priority === 'high' && (
          <span className="exam-card__priority">High Priority</span>
        )}
      </div>
    </button>
  )
}
