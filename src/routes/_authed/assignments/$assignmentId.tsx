import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import {
  fetchAssignment,
  updateAssignment,
  deleteAssignment,
  updateAssignmentStatus,
  gradeAssignment,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  formatDueDate,
  isOverdue,
  ASSIGNMENT_STATUSES,
  type Assignment,
  type UpdateAssignment,
} from '~/utils/assignments'
import { fetchClasses, type Class } from '~/utils/classes'
import { AssignmentForm, type AssignmentFormData } from '~/components/assignments'
import { Modal, Button, Input } from '~/components/ui'

export const Route = createFileRoute('/_authed/assignments/$assignmentId')({
  loader: async ({ params }) => {
    const [assignmentResult, classesResult] = await Promise.all([
      fetchAssignment({ data: { id: params.assignmentId } }),
      fetchClasses({}),
    ])

    return {
      assignment: assignmentResult.assignment,
      classes: classesResult.classes || [],
    }
  },
  component: AssignmentDetailPage,
})

function formatDateTime(dateStr: string): { date: string; time: string } {
  const date = new Date(dateStr)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

function AssignmentDetailPage() {
  const { assignment: initialAssignment, classes } = Route.useLoaderData()
  const navigate = useNavigate()

  const [assignment, setAssignment] = useState<Assignment | null>(initialAssignment)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [gradeValue, setGradeValue] = useState('')
  const [feedbackValue, setFeedbackValue] = useState('')

  if (!assignment) {
    return (
      <div className="assignment-detail-page">
        <div className="assignment-detail-page__not-found">
          <h2>Assignment not found</h2>
          <p>This assignment may have been deleted.</p>
          <Link to="/assignments">Back to Assignments</Link>
        </div>
      </div>
    )
  }

  const linkedClass = assignment.linked_class_id
    ? classes.find(c => c.id === assignment.linked_class_id)
    : null

  const overdue = !assignment.completed && isOverdue(assignment.due_date)

  const handleEdit = useCallback(() => {
    setIsEditModalOpen(true)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false)
  }, [])

  const handleSubmit = useCallback(async (data: AssignmentFormData) => {
    if (!assignment) return

    setIsLoading(true)
    try {
      const dueDateTime = new Date(`${data.due_date}T${data.due_time || '23:59'}`)

      const updates: UpdateAssignment = {
        title: data.title,
        description: data.description || null,
        instructions: data.instructions || null,
        due_date: dueDateTime.toISOString(),
        linked_class_id: data.linked_class_id,
        priority: data.priority,
        max_grade: data.max_grade,
        weight: data.weight,
      }

      const result = await updateAssignment({ data: { id: assignment.id, updates } })
      if (result.assignment) {
        setAssignment(result.assignment)
        handleCloseEditModal()
      }
    } finally {
      setIsLoading(false)
    }
  }, [assignment, handleCloseEditModal])

  const handleDelete = useCallback(async () => {
    if (!assignment) return

    if (!window.confirm('Delete this assignment? This cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteAssignment({ data: { id: assignment.id } })
      if (result.success) {
        navigate({ to: '/assignments' })
      }
    } finally {
      setIsLoading(false)
    }
  }, [assignment, navigate])

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!assignment) return

    const result = await updateAssignmentStatus({
      data: { id: assignment.id, status: newStatus as Assignment['status'] }
    })

    if (result.success) {
      setAssignment((prev) => prev ? {
        ...prev,
        status: newStatus as Assignment['status'],
        completed: newStatus === 'graded',
        submitted_at: newStatus === 'submitted' ? new Date().toISOString() : prev.submitted_at,
        graded_at: newStatus === 'graded' ? new Date().toISOString() : prev.graded_at,
      } : null)
    }
  }, [assignment])

  const handleOpenGradeModal = useCallback(() => {
    setGradeValue(assignment?.grade?.toString() || '')
    setFeedbackValue(assignment?.feedback || '')
    setIsGradeModalOpen(true)
  }, [assignment])

  const handleCloseGradeModal = useCallback(() => {
    setIsGradeModalOpen(false)
  }, [])

  const handleGradeSubmit = useCallback(async () => {
    if (!assignment) return

    const grade = parseFloat(gradeValue)
    if (isNaN(grade)) return

    setIsLoading(true)
    try {
      const result = await gradeAssignment({
        data: { id: assignment.id, grade, feedback: feedbackValue || undefined }
      })

      if (result.success) {
        setAssignment((prev) => prev ? {
          ...prev,
          grade,
          feedback: feedbackValue || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
          completed: true,
        } : null)
        handleCloseGradeModal()
      }
    } finally {
      setIsLoading(false)
    }
  }, [assignment, gradeValue, feedbackValue, handleCloseGradeModal])

  const getInitialFormData = (): Partial<AssignmentFormData> => {
    const { date, time } = formatDateTime(assignment.due_date)
    return {
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      due_date: date,
      due_time: time,
      linked_class_id: assignment.linked_class_id,
      priority: assignment.priority || 'medium',
      max_grade: assignment.max_grade,
      weight: assignment.weight,
    }
  }

  return (
    <div className="assignment-detail-page">
      {/* Header */}
      <div className="assignment-detail-page__header">
        <Link to="/assignments" className="assignment-detail-page__back">
          <BackIcon />
          <span>Back to Assignments</span>
        </Link>
        <div className="assignment-detail-page__actions">
          <Button variant="ghost" onClick={handleDelete} className="assignment-detail-page__delete-btn">
            <TrashIcon />
            Delete
          </Button>
          <Button onClick={handleEdit}>
            <EditIcon />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="assignment-detail-page__content">
        {/* Main Info */}
        <div className="assignment-detail-page__main">
          {/* Title & Status */}
          <div className="assignment-detail-page__title-section">
            <div className="assignment-detail-page__title-row">
              <h1 className="assignment-detail-page__title">{assignment.title}</h1>
              <span
                className="assignment-detail-page__status-badge"
                style={{ backgroundColor: getStatusColor(assignment.status) }}
              >
                {getStatusLabel(assignment.status)}
              </span>
            </div>
            {assignment.description && (
              <p className="assignment-detail-page__description">{assignment.description}</p>
            )}
          </div>

          {/* Info Grid */}
          <div className="assignment-detail-page__info-grid">
            {/* Due Date */}
            <div className={`assignment-detail-page__card ${overdue ? 'assignment-detail-page__card--overdue' : ''}`}>
              <h3 className="assignment-detail-page__card-title">
                <CalendarIcon />
                Due Date
              </h3>
              <p className="assignment-detail-page__card-value">
                {new Date(assignment.due_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="assignment-detail-page__card-sub">
                {new Date(assignment.due_date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              <p className={`assignment-detail-page__due-label ${overdue ? 'assignment-detail-page__due-label--overdue' : ''}`}>
                {formatDueDate(assignment.due_date)}
              </p>
            </div>

            {/* Class */}
            {linkedClass && (
              <div className="assignment-detail-page__card">
                <h3 className="assignment-detail-page__card-title">
                  <ClassIcon />
                  Class
                </h3>
                <Link
                  to="/classes/$classId"
                  params={{ classId: linkedClass.id }}
                  className="assignment-detail-page__card-link"
                >
                  {linkedClass.module_name || linkedClass.title}
                </Link>
              </div>
            )}

            {/* Priority */}
            <div className="assignment-detail-page__card">
              <h3 className="assignment-detail-page__card-title">
                <FlagIcon />
                Priority
              </h3>
              <span
                className="assignment-detail-page__priority"
                style={{ backgroundColor: getPriorityColor(assignment.priority) }}
              >
                {getPriorityLabel(assignment.priority)}
              </span>
            </div>

            {/* Grade */}
            <div className="assignment-detail-page__card">
              <h3 className="assignment-detail-page__card-title">
                <GradeIcon />
                Grade
              </h3>
              {assignment.grade !== null ? (
                <p className="assignment-detail-page__grade">
                  {assignment.grade} / {assignment.max_grade || 100}
                  {assignment.weight && (
                    <span className="assignment-detail-page__weight">
                      ({assignment.weight}% weight)
                    </span>
                  )}
                </p>
              ) : (
                <p className="assignment-detail-page__card-value--muted">Not graded</p>
              )}
              <button
                className="assignment-detail-page__grade-btn"
                onClick={handleOpenGradeModal}
              >
                {assignment.grade !== null ? 'Update Grade' : 'Add Grade'}
              </button>
            </div>
          </div>

          {/* Status Actions */}
          <div className="assignment-detail-page__status-section">
            <h2 className="assignment-detail-page__section-title">Status</h2>
            <div className="assignment-detail-page__status-buttons">
              {ASSIGNMENT_STATUSES.map((status) => (
                <button
                  key={status.value}
                  className={`assignment-detail-page__status-btn ${assignment.status === status.value ? 'assignment-detail-page__status-btn--active' : ''}`}
                  style={{
                    borderColor: assignment.status === status.value ? status.color : undefined,
                    backgroundColor: assignment.status === status.value ? `${status.color}15` : undefined,
                  }}
                  onClick={() => handleStatusChange(status.value)}
                >
                  <span
                    className="assignment-detail-page__status-dot"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {assignment.instructions && (
            <div className="assignment-detail-page__section">
              <h2 className="assignment-detail-page__section-title">Instructions</h2>
              <div
                className="assignment-detail-page__instructions"
                dangerouslySetInnerHTML={{ __html: assignment.instructions }}
              />
            </div>
          )}

          {/* Feedback */}
          {assignment.feedback && (
            <div className="assignment-detail-page__section">
              <h2 className="assignment-detail-page__section-title">Feedback</h2>
              <div className="assignment-detail-page__feedback">
                {assignment.feedback}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="assignment-detail-page__timestamps">
            {assignment.submitted_at && (
              <p>Submitted: {new Date(assignment.submitted_at).toLocaleString()}</p>
            )}
            {assignment.graded_at && (
              <p>Graded: {new Date(assignment.graded_at).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Assignment"
        size="lg"
      >
        <AssignmentForm
          initialData={getInitialFormData()}
          onSubmit={handleSubmit}
          onCancel={handleCloseEditModal}
          submitLabel="Save Changes"
          loading={isLoading}
          classes={classes}
        />
      </Modal>

      {/* Grade Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={handleCloseGradeModal}
        title="Grade Assignment"
        size="sm"
      >
        <div className="assignment-detail-page__grade-form">
          <Input
            type="number"
            label={`Grade (out of ${assignment.max_grade || 100})`}
            placeholder="Enter grade"
            value={gradeValue}
            onChange={(e) => setGradeValue(e.target.value)}
            min={0}
            max={assignment.max_grade || 100}
          />
          <div className="assignment-detail-page__feedback-field">
            <label>Feedback (optional)</label>
            <textarea
              placeholder="Add feedback..."
              value={feedbackValue}
              onChange={(e) => setFeedbackValue(e.target.value)}
              rows={4}
            />
          </div>
          <div className="assignment-detail-page__grade-actions">
            <Button variant="ghost" onClick={handleCloseGradeModal}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmit} loading={isLoading}>
              Save Grade
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Icons
function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClassIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function GradeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}
