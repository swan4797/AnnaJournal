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
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').slice(0, 100)
}

// Format date for display
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
}

// Calculate reading time
const getReadingTime = (content: string | null): string => {
  if (!content) return '1 min'
  const text = content.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min${minutes > 1 ? 's' : ''}`
}

// Get icon color based on note color or subject
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

export function NoteCard({ note, isSelected, onClick, onPin }: NoteCardProps) {
  const preview = stripHtml(note.content)
  const iconStyle = getIconStyle(note)
  const readingTime = getReadingTime(note.content)

  return (
    <div
      className={`note-card-v2 ${isSelected ? 'note-card-v2--selected' : ''} ${note.pinned ? 'note-card-v2--pinned' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {note.pinned && (
        <div className="note-card-v2__pin-badge">
          <PinIcon />
        </div>
      )}

      <div className="note-card-v2__icon" style={{ backgroundColor: iconStyle.background }}>
        <NoteIcon color={iconStyle.color} />
      </div>

      <div className="note-card-v2__content">
        <h3 className="note-card-v2__title">{note.title}</h3>

        {preview && (
          <p className="note-card-v2__preview">{preview}{preview.length >= 100 ? '...' : ''}</p>
        )}

        <div className="note-card-v2__meta">
          <span className="note-card-v2__reading-time">{readingTime}</span>
          <span className="note-card-v2__date">{formatDate(note.updated_at)}</span>
        </div>
      </div>

      {onPin && (
        <button
          className="note-card-v2__pin-btn"
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v4.76z" />
    </svg>
  )
}
