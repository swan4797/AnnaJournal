import { ClipboardIcon, CircleIcon } from './icons'

export interface Homework {
  id: string
  title: string
  subject: string
  dueDate: string
  daysUntil: number
  completed: boolean
}

interface HomeworkComingUpProps {
  homework: Homework[]
  onHomeworkClick?: (homeworkId: string) => void
  onToggleComplete?: (homeworkId: string) => void
}

export function HomeworkComingUp({ homework, onHomeworkClick, onToggleComplete }: HomeworkComingUpProps) {
  const getUrgencyClass = (daysUntil: number) => {
    if (daysUntil <= 1) return 'homework-list__item--urgent'
    if (daysUntil <= 3) return 'homework-list__item--soon'
    return ''
  }

  const formatDueDate = (days: number) => {
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  const pendingCount = homework.filter(h => !h.completed).length

  return (
    <div className="dashboard-card dashboard-card--homework">
      <div className="dashboard-card__header">
        <h3 className="dashboard-card__title">
          <ClipboardIcon />
          Assignments
        </h3>
        <div className="dashboard-card__actions">
          <span className="dashboard-card__count">{pendingCount}</span>
          <button type="button" className="dashboard-card__action-btn">
            <MoreIcon />
          </button>
        </div>
      </div>
      <div className="dashboard-card__content">
        {homework.length === 0 ? (
          <div className="dashboard-card__empty">
            <CircleIcon />
            <span>No assignments due</span>
          </div>
        ) : (
          <ul className="homework-list">
            {homework.map((item) => (
              <li
                key={item.id}
                className={`homework-list__item ${getUrgencyClass(item.daysUntil)} ${item.completed ? 'homework-list__item--completed' : ''}`}
              >
                <button
                  type="button"
                  className={`homework-list__checkbox ${item.completed ? 'homework-list__checkbox--checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleComplete?.(item.id)
                  }}
                >
                  {item.completed && <CheckIcon />}
                </button>
                <button type="button" className="homework-list__content" onClick={() => onHomeworkClick?.(item.id)}>
                  <span className={`homework-list__title ${item.completed ? 'homework-list__title--completed' : ''}`}>
                    {item.title}
                  </span>
                  <div className="homework-list__meta">
                    <span className="homework-list__subject">{item.subject}</span>
                    <span className={`homework-list__due ${item.daysUntil <= 1 ? 'homework-list__due--urgent' : ''}`}>
                      {formatDueDate(item.daysUntil)}
                    </span>
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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
}
