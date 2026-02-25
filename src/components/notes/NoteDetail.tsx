import type { Note } from '~/utils/notes'

interface NoteDetailProps {
  note: Note
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  onTogglePin: () => void
}

// Calculate reading time
const getReadingTime = (content: string | null): string => {
  if (!content) return '1 min'
  const text = content.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

// Get icon color based on note color
const getIconStyle = (note: Note): { background: string; color: string } => {
  const colorMap: Record<string, { background: string; color: string }> = {
    blue: { background: '#E8F0FE', color: '#4285F4' },
    green: { background: '#E6F4EA', color: '#34A853' },
    purple: { background: '#F3E8FD', color: '#9334E6' },
    orange: { background: '#FEF3E8', color: '#FA7B17' },
    pink: { background: '#FCE8F3', color: '#E91E63' },
    cyan: { background: '#E8F7F9', color: '#00ACC1' },
    amber: { background: '#FEF7E0', color: '#F9AB00' },
    rose: { background: '#FBE9E7', color: '#FF5722' },
  }
  return colorMap[note.color || 'blue'] || colorMap.blue
}

export function NoteDetail({ note, onEdit, onDelete, onClose, onTogglePin }: NoteDetailProps) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete()
    }
  }

  const iconStyle = getIconStyle(note)
  const readingTime = getReadingTime(note.content)

  return (
    <div className="note-detail-v2">
      <div className="note-detail-v2__header">
        <div className="note-detail-v2__header-left">
          <div className="note-detail-v2__icon" style={{ backgroundColor: iconStyle.background }}>
            <NoteIcon color={iconStyle.color} />
          </div>
          <h1 className="note-detail-v2__title">{note.title}</h1>
        </div>

        <div className="note-detail-v2__actions">
          <button
            className={`note-detail-v2__pin-btn ${note.pinned ? 'note-detail-v2__pin-btn--active' : ''}`}
            onClick={onTogglePin}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <PinIcon />
          </button>
          <button
            className="note-detail-v2__edit-btn"
            onClick={onEdit}
          >
            <EditIcon />
            <span>Edit</span>
          </button>
          <button
            className="note-detail-v2__delete-btn"
            onClick={handleDelete}
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="note-detail-v2__meta">
        <span className="note-detail-v2__reading-time">
          <ClockIcon />
          {readingTime}
        </span>
        {note.subject && (
          <span className="note-detail-v2__subject">{note.subject}</span>
        )}
      </div>

      <div className="note-detail-v2__body">
        <div
          className="note-detail-v2__content"
          dangerouslySetInnerHTML={{ __html: note.content || '<p>No content</p>' }}
        />
      </div>

      <div className="note-detail-v2__footer">
        <button className="note-detail-v2__close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

function NoteIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
