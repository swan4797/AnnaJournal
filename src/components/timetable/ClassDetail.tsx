import { Button } from '~/components/ui'
import type { Class, ClassException } from '~/utils/classes'
import { DAYS_OF_WEEK, formatClassTime, formatClassDays, getClassColorHex } from '~/utils/classes'
import type { Event } from '~/utils/events'
import type { Note } from '~/utils/notes'

interface ClassDetailProps {
  classItem: Class
  exceptions: ClassException[]
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  linkedExam?: Event
  linkedNotes?: Note[]
  onNoteClick?: (noteId: string) => void
}

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
    case 'cancelled':
      return 'Cancelled'
    case 'rescheduled':
      return 'Rescheduled'
    case 'moved':
      return 'Room Changed'
    default:
      return type
  }
}

export function ClassDetail({
  classItem,
  exceptions,
  onEdit,
  onDelete,
  onClose,
  linkedExam,
  linkedNotes = [],
  onNoteClick,
}: ClassDetailProps) {
  const colorHex = getClassColorHex(classItem.color)

  return (
    <div className="class-detail">
      <div className="class-detail__header">
        <button
          type="button"
          className="class-detail__close"
          onClick={onClose}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="class-detail__content">
        {/* Title with color indicator */}
        <div className="class-detail__title-row">
          <span
            className="class-detail__color-dot"
            style={{ backgroundColor: colorHex }}
          />
          <h2 className="class-detail__title">{classItem.title}</h2>
        </div>

        {/* Module info */}
        {(classItem.module_code || classItem.module_name) && (
          <div className="class-detail__module">
            {classItem.module_code && (
              <span className="class-detail__module-code">{classItem.module_code}</span>
            )}
            {classItem.module_name && (
              <span className="class-detail__module-name">{classItem.module_name}</span>
            )}
          </div>
        )}

        {/* Schedule */}
        <div className="class-detail__section">
          <h3 className="class-detail__section-title">Schedule</h3>
          <div className="class-detail__schedule">
            <div className="class-detail__schedule-days">
              {DAYS_OF_WEEK.map((day) => (
                <span
                  key={day.value}
                  className={`class-detail__day-circle ${classItem.days_of_week.includes(day.value) ? 'class-detail__day-circle--active' : ''}`}
                >
                  {day.short.charAt(0)}
                </span>
              ))}
            </div>
            <div className="class-detail__schedule-time">
              {formatClassTime(classItem.start_time)} - {formatClassTime(classItem.end_time)}
            </div>
          </div>
        </div>

        {/* Semester dates */}
        <div className="class-detail__section">
          <h3 className="class-detail__section-title">Semester</h3>
          <p className="class-detail__semester">
            {formatDate(classItem.semester_start)} — {formatDate(classItem.semester_end)}
          </p>
        </div>

        {/* Instructor */}
        {classItem.instructor && (
          <div className="class-detail__section">
            <h3 className="class-detail__section-title">Instructor</h3>
            <p className="class-detail__text">{classItem.instructor}</p>
          </div>
        )}

        {/* Location */}
        {classItem.location && (
          <div className="class-detail__section">
            <h3 className="class-detail__section-title">Location</h3>
            <p className="class-detail__text">{classItem.location}</p>
          </div>
        )}

        {/* Linked Exam */}
        {linkedExam && (
          <div className="class-detail__section">
            <h3 className="class-detail__section-title">Linked Exam</h3>
            <p className="class-detail__text">{linkedExam.title}</p>
          </div>
        )}

        {/* Class Description */}
        {classItem.description && (
          <div className="class-detail__section">
            <h3 className="class-detail__section-title">Description</h3>
            <div
              className="class-detail__description"
              dangerouslySetInnerHTML={{ __html: classItem.description }}
            />
          </div>
        )}

        {/* Linked Study Notes */}
        {linkedNotes.length > 0 && (
          <div className="class-detail__section">
            <h3 className="class-detail__section-title">Study Notes ({linkedNotes.length})</h3>
            <ul className="class-detail__linked-notes">
              {linkedNotes.map((note) => (
                <li key={note.id} className="class-detail__linked-note">
                  <button
                    type="button"
                    className="class-detail__linked-note-btn"
                    onClick={() => onNoteClick?.(note.id)}
                  >
                    <NoteIcon />
                    <span className="class-detail__linked-note-title">{note.title}</span>
                    {note.pinned && <PinIcon />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exceptions */}
        {exceptions.length > 0 && (
          <div className="class-detail__section">
            <h3 className="class-detail__section-title">Schedule Changes</h3>
            <ul className="class-detail__exception-list">
              {exceptions.map((exc) => (
                <li key={exc.id} className="class-detail__exception">
                  <span className="class-detail__exception-date">
                    {formatDate(exc.exception_date)}
                  </span>
                  <span className={`class-detail__exception-type class-detail__exception-type--${exc.exception_type}`}>
                    {getExceptionTypeLabel(exc.exception_type)}
                  </span>
                  {exc.reason && (
                    <span className="class-detail__exception-reason">{exc.reason}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="class-detail__actions">
        <Button variant="ghost" onClick={onDelete} className="class-detail__delete-btn">
          <TrashIcon />
          Delete
        </Button>
        <Button onClick={onEdit}>
          <EditIcon />
          Edit
        </Button>
      </div>
    </div>
  )
}

// Icon components
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
