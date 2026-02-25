import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import {
  fetchAssignments,
  createAssignment,
  updateAssignmentStatus,
  getStatusLabel,
  getStatusColor,
  getPriorityColor,
  formatDueDate,
  isOverdue,
  type Assignment,
  type NewAssignment,
} from '~/utils/assignments'
import { fetchClasses, type Class } from '~/utils/classes'
import { AssignmentForm, type AssignmentFormData } from '~/components/assignments'
import { Modal } from '~/components/ui'

export const Route = createFileRoute('/_authed/assignments/')({
  loader: async () => {
    const [assignmentsResult, classesResult] = await Promise.all([
      fetchAssignments({ data: { limit: 50 } }),
      fetchClasses({}),
    ])

    return {
      assignments: assignmentsResult.assignments || [],
      classes: classesResult.classes || [],
    }
  },
  component: AssignmentsPage,
})

function AssignmentsPage() {
  const { assignments: initialAssignments, classes } = Route.useLoaderData()
  const navigate = useNavigate()

  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')
  const [classFilter, setClassFilter] = useState<string>('')

  const handleAssignmentClick = useCallback((assignmentId: string) => {
    navigate({ to: '/assignments/$assignmentId', params: { assignmentId } })
  }, [navigate])

  const handleCreateNew = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const handleSubmit = useCallback(async (data: AssignmentFormData) => {
    setIsLoading(true)
    try {
      // Combine date and time
      const dueDateTime = new Date(`${data.due_date}T${data.due_time || '23:59'}`)

      const newAssignment: Omit<NewAssignment, 'user_id'> = {
        title: data.title,
        description: data.description || null,
        instructions: data.instructions || null,
        due_date: dueDateTime.toISOString(),
        linked_class_id: data.linked_class_id,
        priority: data.priority,
        max_grade: data.max_grade,
        weight: data.weight,
      }

      const result = await createAssignment({ data: newAssignment })
      if (result.assignment) {
        setAssignments((prev) => [...prev, result.assignment!].sort(
          (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        ))
        handleCloseModal()
        navigate({ to: '/assignments/$assignmentId', params: { assignmentId: result.assignment.id } })
      }
    } finally {
      setIsLoading(false)
    }
  }, [handleCloseModal, navigate])

  const handleToggleComplete = useCallback(async (assignment: Assignment, e: React.MouseEvent) => {
    e.stopPropagation()

    const newStatus = assignment.completed ? 'not_started' : 'submitted'
    const result = await updateAssignmentStatus({
      data: { id: assignment.id, status: newStatus as 'not_started' | 'submitted' }
    })

    if (result.success) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id
            ? { ...a, status: newStatus, completed: newStatus === 'submitted' }
            : a
        )
      )
    }
  }, [])

  // Filter assignments
  const filteredAssignments = assignments.filter((a) => {
    // Status filter
    if (filter === 'upcoming' && (a.completed || new Date(a.due_date) < new Date())) return false
    if (filter === 'completed' && !a.completed) return false

    // Class filter
    if (classFilter && a.linked_class_id !== classFilter) return false

    return true
  })

  // Group by status
  const overdueAssignments = filteredAssignments.filter(a => !a.completed && isOverdue(a.due_date))
  const upcomingAssignments = filteredAssignments.filter(a => !a.completed && !isOverdue(a.due_date))
  const completedAssignments = filteredAssignments.filter(a => a.completed)

  // Get class name helper
  const getClassName = (classId: string | null) => {
    if (!classId) return null
    const cls = classes.find(c => c.id === classId)
    return cls?.module_name || cls?.title || null
  }

  return (
    <div className="assignments-page">
      {/* Header */}
      <div className="assignments-page__header">
        <div className="assignments-page__header-left">
          <h1 className="assignments-page__title">Assignments</h1>
          <p className="assignments-page__subtitle">
            {upcomingAssignments.length} upcoming, {overdueAssignments.length} overdue
          </p>
        </div>
        <button className="assignments-page__add-btn" onClick={handleCreateNew}>
          <PlusIcon />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="assignments-page__filters">
        <div className="assignments-page__filter-tabs">
          <button
            className={`assignments-page__filter-tab ${filter === 'all' ? 'assignments-page__filter-tab--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`assignments-page__filter-tab ${filter === 'upcoming' ? 'assignments-page__filter-tab--active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`assignments-page__filter-tab ${filter === 'completed' ? 'assignments-page__filter-tab--active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        {classes.length > 0 && (
          <select
            className="assignments-page__class-filter"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.module_name || c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      <div className="assignments-page__content">
        {filteredAssignments.length === 0 ? (
          <div className="assignments-page__empty">
            <EmptyIcon />
            <h3>No assignments</h3>
            <p>Create your first assignment to get started.</p>
            <button onClick={handleCreateNew}>New Assignment</button>
          </div>
        ) : (
          <div className="assignments-page__lists">
            {/* Overdue */}
            {overdueAssignments.length > 0 && filter !== 'completed' && (
              <div className="assignments-page__section">
                <h2 className="assignments-page__section-title assignments-page__section-title--overdue">
                  <AlertIcon />
                  Overdue ({overdueAssignments.length})
                </h2>
                <div className="assignments-page__list">
                  {overdueAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      className={getClassName(assignment.linked_class_id)}
                      onClick={() => handleAssignmentClick(assignment.id)}
                      onToggleComplete={(e) => handleToggleComplete(assignment, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingAssignments.length > 0 && filter !== 'completed' && (
              <div className="assignments-page__section">
                <h2 className="assignments-page__section-title">
                  Upcoming ({upcomingAssignments.length})
                </h2>
                <div className="assignments-page__list">
                  {upcomingAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      className={getClassName(assignment.linked_class_id)}
                      onClick={() => handleAssignmentClick(assignment.id)}
                      onToggleComplete={(e) => handleToggleComplete(assignment, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedAssignments.length > 0 && filter !== 'upcoming' && (
              <div className="assignments-page__section">
                <h2 className="assignments-page__section-title">
                  Completed ({completedAssignments.length})
                </h2>
                <div className="assignments-page__list">
                  {completedAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      className={getClassName(assignment.linked_class_id)}
                      onClick={() => handleAssignmentClick(assignment.id)}
                      onToggleComplete={(e) => handleToggleComplete(assignment, e)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="New Assignment"
        size="lg"
      >
        <AssignmentForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          submitLabel="Create Assignment"
          loading={isLoading}
          classes={classes}
        />
      </Modal>
    </div>
  )
}

// Assignment Card Component
interface AssignmentCardProps {
  assignment: Assignment
  className: string | null
  onClick: () => void
  onToggleComplete: (e: React.MouseEvent) => void
}

function AssignmentCard({ assignment, className, onClick, onToggleComplete }: AssignmentCardProps) {
  const overdue = !assignment.completed && isOverdue(assignment.due_date)

  return (
    <div
      className={`assignment-card ${assignment.completed ? 'assignment-card--completed' : ''} ${overdue ? 'assignment-card--overdue' : ''}`}
      onClick={onClick}
    >
      <button
        className={`assignment-card__checkbox ${assignment.completed ? 'assignment-card__checkbox--checked' : ''}`}
        onClick={onToggleComplete}
      >
        {assignment.completed && <CheckIcon />}
      </button>

      <div className="assignment-card__content">
        <div className="assignment-card__header">
          <h3 className="assignment-card__title">{assignment.title}</h3>
          <span
            className="assignment-card__priority"
            style={{ backgroundColor: getPriorityColor(assignment.priority) }}
          >
            {assignment.priority}
          </span>
        </div>

        <div className="assignment-card__meta">
          {className && (
            <span className="assignment-card__class">{className}</span>
          )}
          <span className={`assignment-card__due ${overdue ? 'assignment-card__due--overdue' : ''}`}>
            {formatDueDate(assignment.due_date)}
          </span>
        </div>

        {assignment.grade !== null && (
          <div className="assignment-card__grade">
            {assignment.grade}/{assignment.max_grade || 100}
          </div>
        )}
      </div>

      <span
        className="assignment-card__status"
        style={{ backgroundColor: getStatusColor(assignment.status) }}
      >
        {getStatusLabel(assignment.status)}
      </span>
    </div>
  )
}

// Icons
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function EmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
