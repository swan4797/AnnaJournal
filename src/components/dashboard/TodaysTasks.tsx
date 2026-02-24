import { CheckIcon, CircleIcon } from './icons'

export interface Task {
  id: string
  title: string
  completed: boolean
  category: 'task' | 'homework' | 'exam'
  dueTime?: string
}

interface TodaysTasksProps {
  tasks: Task[]
  onToggleComplete?: (taskId: string) => void
}

export function TodaysTasks({ tasks, onToggleComplete }: TodaysTasksProps) {
  return (
    <div className="dashboard-card dashboard-card--tasks">
      <div className="dashboard-card__header">
        <h3 className="dashboard-card__title">Today's Tasks</h3>
        <span className="dashboard-card__count">{tasks.filter(t => !t.completed).length} remaining</span>
      </div>
      <div className="dashboard-card__content">
        {tasks.length === 0 ? (
          <div className="dashboard-card__empty">
            <CircleIcon />
            <span>No tasks for today</span>
          </div>
        ) : (
          <ul className="tasks-list">
            {tasks.map((task) => (
              <li key={task.id} className="tasks-list__item">
                <button
                  className={`tasks-list__checkbox ${task.completed ? 'tasks-list__checkbox--checked' : ''}`}
                  onClick={() => onToggleComplete?.(task.id)}
                >
                  {task.completed && <CheckIcon />}
                </button>
                <div className="tasks-list__content">
                  <span className={`tasks-list__title ${task.completed ? 'tasks-list__title--completed' : ''}`}>
                    {task.title}
                  </span>
                  {task.dueTime && (
                    <span className="tasks-list__time">{task.dueTime}</span>
                  )}
                </div>
                <span className={`tasks-list__category tasks-list__category--${task.category}`}>
                  {task.category}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
