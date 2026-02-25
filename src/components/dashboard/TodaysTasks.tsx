import { CheckIcon, CircleIcon, MoreIcon, PlusIcon } from './icons'

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

// Helper to get category display label
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    task: 'Task',
    homework: 'Theory',
    exam: 'Exam',
  }
  return labels[category] || category
}

// Helper to get mock teacher name based on category
const getTeacherName = (category: string, index: number) => {
  const teachers = ['Mrs Diana Smith', 'Mr Jhon Lock', 'Mr Malvin Ruslan']
  return teachers[index % teachers.length]
}

// Helper to get mock subject based on category
const getSubject = (category: string) => {
  const subjects: Record<string, string> = {
    task: 'Biography',
    homework: 'Math',
    exam: 'Psycholgy',
  }
  return subjects[category] || 'General'
}

export function TodaysTasks({ tasks, onToggleComplete }: TodaysTasksProps) {
  return (
    <div className="today-tasks">
      <h2 className="today-tasks__title">Today Tasks<span className="today-tasks__dot">.</span></h2>
      <div className="today-tasks__label">To - do</div>

      <div className="today-tasks__content">
        {tasks.length === 0 ? (
          <div className="today-tasks__empty">
            <CircleIcon />
            <span>No tasks for today</span>
          </div>
        ) : (
          <ul className="today-tasks__list">
            {tasks.map((task, index) => (
              <li key={task.id} className={`today-tasks__item ${task.completed ? 'today-tasks__item--completed' : ''}`}>
                <div className={`today-tasks__indicator today-tasks__indicator--${task.category}`} />
                <div className="today-tasks__info">
                  <span className={`today-tasks__name ${task.completed ? 'today-tasks__name--completed' : ''}`}>
                    {task.title}
                  </span>
                  <span className="today-tasks__meta">
                    {getSubject(task.category)} . {getTeacherName(task.category, index)}
                  </span>
                </div>
                <span className={`today-tasks__category today-tasks__category--${task.category}`}>
                  {getCategoryLabel(task.category)}
                </span>
                <button className="today-tasks__more">
                  <MoreIcon />
                </button>
                <button
                  className={`today-tasks__action ${task.completed ? 'today-tasks__action--done' : 'today-tasks__action--add'}`}
                  onClick={() => onToggleComplete?.(task.id)}
                >
                  {task.completed ? 'Mark as Done' : (
                    <>
                      <PlusIcon />
                      Add or Create
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
