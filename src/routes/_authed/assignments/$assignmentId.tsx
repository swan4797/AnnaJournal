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
          <button type="button" onClick={handleDelete} className="assignment-detail-page__action-btn assignment-detail-page__action-btn--delete">
            <TrashIcon />
          </button>
          <button type="button" onClick={handleEdit} className="assignment-detail-page__action-btn assignment-detail-page__action-btn--edit">
            <EditIcon />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="assignment-detail-page__content">
        {/* Main Info */}
        <div className="assignment-detail-page__main">
          {/* Hero Card */}
          <div className={`assignment-detail-page__hero ${overdue ? 'assignment-detail-page__hero--overdue' : ''}`}>
            <div className="assignment-detail-page__hero-icon">
              <AssignmentIcon />
            </div>
            <div className="assignment-detail-page__hero-content">
              <div className="assignment-detail-page__hero-top">
                <h1 className="assignment-detail-page__title">{assignment.title}</h1>
                <span
                  className="assignment-detail-page__status-pill"
                  style={{
                    backgroundColor: `${getStatusColor(assignment.status)}20`,
                    color: getStatusColor(assignment.status)
                  }}
                >
                  {getStatusLabel(assignment.status)}
                </span>
              </div>
              {assignment.description && (
                <p className="assignment-detail-page__subtitle">{assignment.description}</p>
              )}
            </div>
          </div>

          {/* Detailed Information Card */}
          <div className="assignment-detail-page__info-card">
            <h2 className="assignment-detail-page__info-card-title">Detailed Information</h2>
            <div className="assignment-detail-page__info-rows">
              {/* Due Date Row */}
              <div className={`assignment-detail-page__info-row ${overdue ? 'assignment-detail-page__info-row--overdue' : ''}`}>
                <div className="assignment-detail-page__info-icon">
                  <CalendarIcon />
                </div>
                <div className="assignment-detail-page__info-content">
                  <span className="assignment-detail-page__info-label">Due Date</span>
                  <div className="assignment-detail-page__info-value">
                    <span className="assignment-detail-page__due-date">
                      {new Date(assignment.due_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="assignment-detail-page__due-time">
                      {new Date(assignment.due_date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className={`assignment-detail-page__due-countdown ${overdue ? 'assignment-detail-page__due-countdown--overdue' : ''}`}>
                      {formatDueDate(assignment.due_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Class Row */}
              {linkedClass && (
                <div className="assignment-detail-page__info-row">
                  <div className="assignment-detail-page__info-icon">
                    <ClassIcon />
                  </div>
                  <div className="assignment-detail-page__info-content">
                    <span className="assignment-detail-page__info-label">Class</span>
                    <Link
                      to="/classes/$classId"
                      params={{ classId: linkedClass.id }}
                      className="assignment-detail-page__info-link"
                    >
                      {linkedClass.module_name || linkedClass.title}
                    </Link>
                  </div>
                </div>
              )}

              {/* Priority Row */}
              <div className="assignment-detail-page__info-row">
                <div className="assignment-detail-page__info-icon">
                  <FlagIcon />
                </div>
                <div className="assignment-detail-page__info-content">
                  <span className="assignment-detail-page__info-label">Priority</span>
                  <span
                    className="assignment-detail-page__priority-pill"
                    style={{
                      backgroundColor: `${getPriorityColor(assignment.priority)}20`,
                      color: getPriorityColor(assignment.priority)
                    }}
                  >
                    {getPriorityLabel(assignment.priority)}
                  </span>
                </div>
              </div>

              {/* Grade Row */}
              <div className="assignment-detail-page__info-row">
                <div className="assignment-detail-page__info-icon">
                  <GradeIcon />
                </div>
                <div className="assignment-detail-page__info-content">
                  <span className="assignment-detail-page__info-label">Grade</span>
                  <div className="assignment-detail-page__grade-content">
                    {assignment.grade !== null ? (
                      <div className="assignment-detail-page__grade-display">
                        <span className="assignment-detail-page__grade-value">
                          {assignment.grade} / {assignment.max_grade || 100}
                        </span>
                        {assignment.weight && (
                          <span className="assignment-detail-page__grade-weight">
                            {assignment.weight}% weight
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="assignment-detail-page__grade-empty">Not graded</span>
                    )}
                    <button
                      type="button"
                      className="assignment-detail-page__grade-btn"
                      onClick={handleOpenGradeModal}
                    >
                      {assignment.grade !== null ? 'Update' : 'Add Grade'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="assignment-detail-page__status-card">
            <h2 className="assignment-detail-page__card-title">Status</h2>
            <div className="assignment-detail-page__status-grid">
              {ASSIGNMENT_STATUSES.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  className={`assignment-detail-page__status-option ${assignment.status === status.value ? 'assignment-detail-page__status-option--active' : ''}`}
                  style={{
                    '--status-color': status.color,
                  } as React.CSSProperties}
                  onClick={() => handleStatusChange(status.value)}
                >
                  <span className="assignment-detail-page__status-indicator" />
                  <span className="assignment-detail-page__status-label">{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions Card */}
          {assignment.instructions && (
            <div className="assignment-detail-page__instructions-card">
              <h2 className="assignment-detail-page__card-title">Instructions</h2>
              <div
                className="assignment-detail-page__instructions-content"
                dangerouslySetInnerHTML={{ __html: assignment.instructions }}
              />
            </div>
          )}

          {/* Feedback Card */}
          {assignment.feedback && (
            <div className="assignment-detail-page__feedback-card">
              <h2 className="assignment-detail-page__card-title">Feedback</h2>
              <div className="assignment-detail-page__feedback-content">
                {assignment.feedback}
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(assignment.submitted_at || assignment.graded_at) && (
            <div className="assignment-detail-page__timestamps">
              {assignment.submitted_at && (
                <div className="assignment-detail-page__timestamp">
                  <CheckIcon />
                  <span>Submitted {new Date(assignment.submitted_at).toLocaleString()}</span>
                </div>
              )}
              {assignment.graded_at && (
                <div className="assignment-detail-page__timestamp">
                  <GradeIcon />
                  <span>Graded {new Date(assignment.graded_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
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

function AssignmentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
}
