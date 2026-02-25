import type { Note } from '~/utils/notes'
import { SubjectBadge } from './SubjectBadge'

interface NoteDetailProps {
  note: Note
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  onTogglePin: () => void
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NoteDetail({ note, onEdit, onDelete, onClose, onTogglePin }: NoteDetailProps) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete()
    }
  }

  return (
    <div className="note-detail">
      <div className="note-detail__header">
        <button
          className="note-detail__back"
          onClick={onClose}
          aria-label="Close"
        >
          <ChevronLeftIcon />
          <span>Back</span>
        </button>

        <div className="note-detail__actions">
          <button
            className={`note-detail__action ${note.pinned ? 'note-detail__action--active' : ''}`}
            onClick={onTogglePin}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <PinIcon />
          </button>
          <button
            className="note-detail__action"
            onClick={onEdit}
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            className="note-detail__action note-detail__action--danger"
            onClick={handleDelete}
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="note-detail__body">
        {note.color && (
          <div
            className="note-detail__color-bar"
            style={{ backgroundColor: note.color }}
          />
        )}

        <h1 className="note-detail__title">{note.title}</h1>

        <div className="note-detail__meta">
          {note.subject && (
            <SubjectBadge subject={note.subject} />
          )}
          <span className="note-detail__date">
            Last updated: {formatDate(note.updated_at)}
          </span>
        </div>

        {note.tags && note.tags.length > 0 && (
          <div className="note-detail__tags">
            {note.tags.map((tag) => (
              <span key={tag} className="note-detail__tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="note-detail__content"
          dangerouslySetInnerHTML={{ __html: note.content || '<p>No content</p>' }}
        />
      </div>
    </div>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v4.76z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}
