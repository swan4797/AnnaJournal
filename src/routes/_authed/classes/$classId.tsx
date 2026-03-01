import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import {
  fetchClasses,
  updateClass,
  deleteClass,
  fetchClassExceptions,
  getClassColorHex,
  formatClassDays,
  formatClassTime,
  DAYS_OF_WEEK,
  type Class,
  type ClassException,
  type UpdateClass,
} from '~/utils/classes'
import { searchEvents, type Event } from '~/utils/events'
import { fetchNotesByClass, type Note } from '~/utils/notes'
import { ClassForm, type ClassFormData } from '~/components/timetable'
import { Modal, Button } from '~/components/ui'

export const Route = createFileRoute('/_authed/classes/$classId')({
  loader: async ({ params }) => {
    const [classesResult, examsResult, notesResult, exceptionsResult] = await Promise.all([
      fetchClasses({}),
      searchEvents({
        data: {
          categories: ['exam'],
          startDate: new Date().toISOString(),
          limit: 20,
        },
      }),
      fetchNotesByClass({ data: { classId: params.classId, limit: 50 } }),
      fetchClassExceptions({ data: { classId: params.classId } }),
    ])

    const classItem = classesResult.classes?.find(c => c.id === params.classId)

    return {
      classItem: classItem || null,
      exams: examsResult.events || [],
      notes: notesResult.notes || [],
      exceptions: exceptionsResult.exceptions || [],
    }
  },
  component: ClassDetailPage,
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getExceptionTypeLabel(type: string): string {
  switch (type) {
    case 'cancelled': return 'Cancelled'
    case 'rescheduled': return 'Rescheduled'
    case 'moved': return 'Room Changed'
    default: return type
  }
}

function ClassDetailPage() {
  const { classItem: initialClass, exams, notes: initialNotes, exceptions: initialExceptions } = Route.useLoaderData()
  const navigate = useNavigate()

  const [classItem, setClassItem] = useState<Class | null>(initialClass)
  const [notes] = useState<Note[]>(initialNotes)
  const [exceptions] = useState<ClassException[]>(initialExceptions)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!classItem) {
    return (
      <div className="class-detail-page">
        <div className="class-detail-page__not-found">
          <h2>Class not found</h2>
          <p>This class may have been deleted.</p>
          <Link to="/classes">Back to Classes</Link>
        </div>
      </div>
    )
  }

  const colorHex = getClassColorHex(classItem.color)
  const linkedExam = classItem.linked_exam_id
    ? exams.find(e => e.id === classItem.linked_exam_id)
    : undefined

  const handleEdit = useCallback(() => {
    setIsEditModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsEditModalOpen(false)
  }, [])

  const handleSubmit = useCallback(async (data: ClassFormData) => {
    if (!classItem) return

    setIsLoading(true)
    try {
      const updates: UpdateClass = {
        title: data.title,
        module_code: data.module_code || null,
        module_name: data.module_name || null,
        instructor: data.instructor || null,
        location: data.location || null,
        days_of_week: data.days_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        semester_start: data.semester_start,
        semester_end: data.semester_end,
        color: data.color,
        description: data.description || null,
        linked_exam_id: data.linked_exam_id,
      }

      const result = await updateClass({ data: { id: classItem.id, updates } })
      if (result.class) {
        setClassItem(result.class)
        handleCloseModal()
      }
    } finally {
      setIsLoading(false)
    }
  }, [classItem, handleCloseModal])

  const handleDelete = useCallback(async () => {
    if (!classItem) return

    if (!window.confirm('Delete this class? This will also remove all generated calendar events.')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteClass({ data: { id: classItem.id } })
      if (result.success) {
        navigate({ to: '/classes' })
      }
    } finally {
      setIsLoading(false)
    }
  }, [classItem, navigate])

  const handleNoteClick = useCallback((noteId: string) => {
    navigate({ to: '/notes', search: { id: noteId } })
  }, [navigate])

  const getInitialFormData = (): Partial<ClassFormData> => ({
    title: classItem.title,
    module_code: classItem.module_code || '',
    module_name: classItem.module_name || '',
    instructor: classItem.instructor || '',
    location: classItem.location || '',
    days_of_week: classItem.days_of_week,
    start_time: classItem.start_time,
    end_time: classItem.end_time,
    semester_start: classItem.semester_start,
    semester_end: classItem.semester_end,
    color: classItem.color || 'blue',
    description: classItem.description || '',
    linked_exam_id: classItem.linked_exam_id,
  })

  return (
    <div className="class-detail-page">
      {/* Header */}
      <div className="class-detail-page__header">
        <Link to="/classes" className="class-detail-page__back">
          <BackIcon />
          <span>Back to Classes</span>
        </Link>
        <div className="class-detail-page__actions">
          <button type="button" onClick={handleDelete} className="class-detail-page__action-btn class-detail-page__action-btn--delete">
            <TrashIcon />
          </button>
          <button type="button" onClick={handleEdit} className="class-detail-page__action-btn class-detail-page__action-btn--edit">
            <EditIcon />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="class-detail-page__content">
        {/* Left Column - Class Info */}
        <div className="class-detail-page__main">
          {/* Hero Card */}
          <div className="class-detail-page__hero" style={{ '--class-color': colorHex } as React.CSSProperties}>
            <div className="class-detail-page__hero-icon">
              <BookIcon />
            </div>
            <div className="class-detail-page__hero-content">
              <h1 className="class-detail-page__title">{classItem.title}</h1>
              {(classItem.module_code || classItem.module_name) && (
                <p className="class-detail-page__subtitle">
                  {classItem.module_code && <span className="class-detail-page__module-code">{classItem.module_code}</span>}
                  {classItem.module_code && classItem.module_name && <span className="class-detail-page__separator">·</span>}
                  {classItem.module_name && <span>{classItem.module_name}</span>}
                </p>
              )}
            </div>
          </div>

          {/* Detailed Information Card */}
          <div className="class-detail-page__info-card">
            <h2 className="class-detail-page__info-card-title">Detailed Information</h2>
            <div className="class-detail-page__info-rows">
              {/* Schedule Row */}
              <div className="class-detail-page__info-row">
                <div className="class-detail-page__info-icon">
                  <ScheduleIcon />
                </div>
                <div className="class-detail-page__info-content">
                  <span className="class-detail-page__info-label">Schedule</span>
                  <div className="class-detail-page__info-value">
                    <div className="class-detail-page__day-pills">
                      {DAYS_OF_WEEK.map((day) => (
                        <span
                          key={day.value}
                          className={`class-detail-page__day-pill ${classItem.days_of_week.includes(day.value) ? 'class-detail-page__day-pill--active' : ''}`}
                        >
                          {day.short}
                        </span>
                      ))}
                    </div>
                    <span className="class-detail-page__time-text">
                      {formatClassTime(classItem.start_time)} - {formatClassTime(classItem.end_time)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Semester Row */}
              <div className="class-detail-page__info-row">
                <div className="class-detail-page__info-icon">
                  <CalendarIcon />
                </div>
                <div className="class-detail-page__info-content">
                  <span className="class-detail-page__info-label">Semester</span>
                  <span className="class-detail-page__info-value">
                    {formatDate(classItem.semester_start)} — {formatDate(classItem.semester_end)}
                  </span>
                </div>
              </div>

              {/* Instructor Row */}
              {classItem.instructor && (
                <div className="class-detail-page__info-row">
                  <div className="class-detail-page__info-icon">
                    <InstructorIcon />
                  </div>
                  <div className="class-detail-page__info-content">
                    <span className="class-detail-page__info-label">Instructor</span>
                    <span className="class-detail-page__info-value">{classItem.instructor}</span>
                  </div>
                </div>
              )}

              {/* Location Row */}
              {classItem.location && (
                <div className="class-detail-page__info-row">
                  <div className="class-detail-page__info-icon">
                    <LocationIcon />
                  </div>
                  <div className="class-detail-page__info-content">
                    <span className="class-detail-page__info-label">Location</span>
                    <span className="class-detail-page__info-value">{classItem.location}</span>
                  </div>
                </div>
              )}

              {/* Linked Exam Row */}
              {linkedExam && (
                <div className="class-detail-page__info-row class-detail-page__info-row--exam">
                  <div className="class-detail-page__info-icon">
                    <ExamIcon />
                  </div>
                  <div className="class-detail-page__info-content">
                    <span className="class-detail-page__info-label">Linked Exam</span>
                    <div className="class-detail-page__info-value">
                      <span className="class-detail-page__exam-title">{linkedExam.title}</span>
                      <span className="class-detail-page__exam-date">
                        {new Date(linkedExam.start_time).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description Card */}
          {classItem.description && (
            <div className="class-detail-page__description-card">
              <h2 className="class-detail-page__card-title">Description</h2>
              <div
                className="class-detail-page__description-content"
                dangerouslySetInnerHTML={{ __html: classItem.description }}
              />
            </div>
          )}

          {/* Schedule Changes Card */}
          {exceptions.length > 0 && (
            <div className="class-detail-page__exceptions-card">
              <h2 className="class-detail-page__card-title">Schedule Changes</h2>
              <div className="class-detail-page__exceptions-list">
                {exceptions.map((exc) => (
                  <div key={exc.id} className={`class-detail-page__exception-item class-detail-page__exception-item--${exc.exception_type}`}>
                    <div className="class-detail-page__exception-header">
                      <span className="class-detail-page__exception-date">
                        {formatDate(exc.exception_date)}
                      </span>
                      <span className="class-detail-page__exception-badge">
                        {getExceptionTypeLabel(exc.exception_type)}
                      </span>
                    </div>
                    {exc.reason && (
                      <p className="class-detail-page__exception-reason">{exc.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Study Notes */}
        <div className="class-detail-page__sidebar">
          <div className="class-detail-page__notes-card">
            <div className="class-detail-page__notes-header">
              <div className="class-detail-page__notes-title">
                <NotesIcon />
                <h2>Study Notes</h2>
              </div>
              <span className="class-detail-page__notes-badge">{notes.length}</span>
            </div>

            {notes.length === 0 ? (
              <div className="class-detail-page__notes-empty">
                <div className="class-detail-page__notes-empty-icon">
                  <NotesIcon />
                </div>
                <p>No study notes yet</p>
                <Link to="/notes" className="class-detail-page__notes-create-btn">Create a note</Link>
              </div>
            ) : (
              <div className="class-detail-page__notes-list">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    className="class-detail-page__note-item"
                    onClick={() => handleNoteClick(note.id)}
                  >
                    <div className="class-detail-page__note-top">
                      <span className="class-detail-page__note-title">{note.title}</span>
                      {note.pinned && (
                        <span className="class-detail-page__note-pin">
                          <PinIcon />
                        </span>
                      )}
                    </div>
                    {note.content && (
                      <p className="class-detail-page__note-excerpt">
                        {stripHtml(note.content).slice(0, 100)}...
                      </p>
                    )}
                    <span className="class-detail-page__note-meta">
                      {new Date(note.updated_at || note.created_at || '').toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title="Edit Class"
        size="lg"
      >
        <ClassForm
          initialData={getInitialFormData()}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          submitLabel="Save Changes"
          loading={isLoading}
          exams={exams}
        />
      </Modal>
    </div>
  )
}

// Helper to strip HTML tags for excerpt
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
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

function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
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

function ScheduleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function InstructorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ExamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M16 4l4 4-1.5 1.5-1-1L14 12l1 5-2 2-3-4-4 4-1-1 4-4-4-3 2-2 5 1 3.5-3.5-1-1z" />
    </svg>
  )
}
