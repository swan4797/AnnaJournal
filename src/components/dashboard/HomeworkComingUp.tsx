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

  return (
    <div className="dashboard-card dashboard-card--homework">
      <div className="dashboard-card__header">
        <h3 className="dashboard-card__title">
          <ClipboardIcon />
          Homework Coming Up
        </h3>
        <span className="dashboard-card__count">{homework.filter(h => !h.completed).length} pending</span>
      </div>
      <div className="dashboard-card__content">
        {homework.length === 0 ? (
          <div className="dashboard-card__empty">
            <CircleIcon />
            <span>No homework due</span>
          </div>
        ) : (
          <ul className="homework-list">
            {homework.map((item) => (
              <li
                key={item.id}
                className={`homework-list__item ${getUrgencyClass(item.daysUntil)} ${item.completed ? 'homework-list__item--completed' : ''}`}
              >
                <button
                  className={`homework-list__checkbox ${item.completed ? 'homework-list__checkbox--checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleComplete?.(item.id)
                  }}
                />
                <div className="homework-list__content" onClick={() => onHomeworkClick?.(item.id)}>
                  <span className="homework-list__title">{item.title}</span>
                  <div className="homework-list__meta">
                    <span className="homework-list__subject">{item.subject}</span>
                    <span className="homework-list__due">{formatDueDate(item.daysUntil)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
