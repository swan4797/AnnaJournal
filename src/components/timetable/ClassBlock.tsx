import type { Class } from '~/utils/classes'
import { formatClassTime, getClassColorHex } from '~/utils/classes'

interface ClassBlockProps {
  classItem: Class
  isSelected: boolean
  onClick: () => void
  style: { top: string; height: string }
}

// Category icons for visual display
const CATEGORY_ICONS: Record<string, string> = {
  blue: '📘',
  green: '📗',
  purple: '📕',
  orange: '📙',
  pink: '💗',
  cyan: '🔬',
  amber: '⚡',
  rose: '🎨',
}

export function ClassBlock({ classItem, isSelected, onClick, style }: ClassBlockProps) {
  const colorHex = getClassColorHex(classItem.color)
  const icon = CATEGORY_ICONS[classItem.color || 'blue'] || '📚'

  // Format time range for display
  const formatTimeRange = () => {
    const start = formatClassTime(classItem.start_time)
    const end = formatClassTime(classItem.end_time)
    return `${start} - ${end}`
  }

  return (
    <button
      type="button"
      className={`class-block class-block--${classItem.color || 'blue'} ${isSelected ? 'class-block--selected' : ''}`}
      style={{
        ...style,
        '--class-color': colorHex,
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="class-block__content">
        <span className="class-block__icon">{icon}</span>
        <div className="class-block__info">
          <span className="class-block__title">{classItem.title}</span>
          <span className="class-block__time">{formatTimeRange()}</span>
        </div>
        {classItem.location && (
          <div className="class-block__footer">
            <span className="class-block__location">
              <LocationIcon />
              {classItem.location}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

function LocationIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
