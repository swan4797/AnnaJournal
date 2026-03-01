import type { Event } from '~/utils/events'
import { getCategoryConfig } from '~/utils/categories'

interface ExamCardProps {
  exam: Event
  isSelected: boolean
  onClick: () => void
}

// Color themes for cards based on index
const CARD_THEMES = [
  { bg: '#FEF3C7', accent: '#F59E0B' }, // Yellow
  { bg: '#FFE4E6', accent: '#F43F5E' }, // Pink
  { bg: '#D1FAE5', accent: '#10B981' }, // Mint
  { bg: '#E0E7FF', accent: '#6366F1' }, // Indigo
  { bg: '#FEE2E2', accent: '#EF4444' }, // Red
]

export function ExamCard({ exam, isSelected, onClick }: ExamCardProps) {
  const category = getCategoryConfig(exam.category)
  const examDate = new Date(exam.start_time)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Get a consistent color based on exam id
  const colorIndex = exam.id.charCodeAt(0) % CARD_THEMES.length
  const theme = CARD_THEMES[colorIndex]

  const getUrgencyClass = () => {
    if (daysUntil <= 0) return 'exam-card--past'
    if (daysUntil <= 2) return 'exam-card--urgent'
    if (daysUntil <= 7) return 'exam-card--soon'
    return ''
  }

  const formatDaysLeft = () => {
    if (daysUntil < 0) return 'Past'
    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return '1 Day Left'
    return `${daysUntil} Days Left`
  }

  const formatDateBadge = () => {
    return examDate.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
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

  // Calculate a mock progress percentage based on days until exam
  const getProgress = () => {
    if (daysUntil <= 0) return 100
    if (daysUntil >= 30) return 10
    return Math.min(95, Math.max(20, 100 - (daysUntil * 3)))
  }

  return (
    <button
      type="button"
      className={`exam-card ${getUrgencyClass()} ${isSelected ? 'exam-card--selected' : ''}`}
      style={{ '--card-bg': theme.bg, '--card-accent': theme.accent } as React.CSSProperties}
      onClick={onClick}
    >
      {/* Date Badge */}
      <div className="exam-card__date-badge">
        <span>{formatDateBadge()}</span>
        <button type="button" className="exam-card__more-btn" onClick={(e) => e.stopPropagation()}>
          <MoreIcon />
        </button>
      </div>

      {/* Title & Icon */}
      <div className="exam-card__main">
        <h3 className="exam-card__title">{exam.title}</h3>
        <span className="exam-card__info-icon">
          <InfoIcon />
        </span>
      </div>

      {/* Description/Location */}
      {exam.description && (
        <p className="exam-card__description">{exam.description}</p>
      )}

      {/* Time */}
      <p className="exam-card__time">{formatTime()}</p>

      {/* Progress Section */}
      <div className="exam-card__progress-section">
        <span className="exam-card__progress-label">{getProgress()}%</span>
        <span className="exam-card__progress-tag">Progress</span>
      </div>
      <div className="exam-card__progress-bar">
        <div
          className="exam-card__progress-fill"
          style={{ width: `${getProgress()}%` }}
        />
      </div>

      {/* Footer */}
      <div className="exam-card__footer">
        <div className="exam-card__avatars">
          <span className="exam-card__avatar exam-card__avatar--1" />
          <span className="exam-card__avatar exam-card__avatar--2" />
          <span className="exam-card__avatar exam-card__avatar--3" />
          <span className="exam-card__avatar exam-card__avatar--add">+</span>
        </div>
        <span className={`exam-card__countdown ${daysUntil <= 2 ? 'exam-card__countdown--urgent' : ''}`}>
          {formatDaysLeft()}
        </span>
      </div>

      {/* Priority Badge */}
      {exam.priority === 'high' && (
        <span className="exam-card__priority">High Priority</span>
      )}
    </button>
  )
}

// Icon Components
function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
