import type { Note } from '~/utils/notes'
import { SubjectBadge } from './SubjectBadge'

interface NoteCardProps {
  note: Note
  isSelected?: boolean
  onClick: () => void
  onPin?: () => void
}

// Strip HTML tags for preview
const stripHtml = (html: string | null): string => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').slice(0, 120)
}

// Format date for display
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

export function NoteCard({ note, isSelected, onClick, onPin }: NoteCardProps) {
  const preview = stripHtml(note.content)

  return (
    <div
      className={`note-card ${isSelected ? 'note-card--selected' : ''} ${note.pinned ? 'note-card--pinned' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {note.pinned && (
        <div className="note-card__pin">
          <PinIcon />
        </div>
      )}

      {note.color && (
        <div
          className="note-card__color-accent"
          style={{ backgroundColor: note.color }}
        />
      )}

      <h3 className="note-card__title">{note.title}</h3>

      {preview && (
        <p className="note-card__preview">{preview}...</p>
      )}

      <div className="note-card__meta">
        {note.subject && (
          <SubjectBadge subject={note.subject} />
        )}
        <span className="note-card__date">{formatDate(note.updated_at)}</span>
      </div>

      {onPin && (
        <button
          className="note-card__pin-btn"
          onClick={(e) => {
            e.stopPropagation()
            onPin()
          }}
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          <PinIcon />
        </button>
      )}
    </div>
  )
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v4.76z" />
    </svg>
  )
}
