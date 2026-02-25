import type { Class } from '~/utils/classes'
import { formatClassTime, getClassColorHex } from '~/utils/classes'

interface ClassBlockProps {
  classItem: Class
  isSelected: boolean
  onClick: () => void
  style: { top: string; height: string }
}

export function ClassBlock({ classItem, isSelected, onClick, style }: ClassBlockProps) {
  const colorHex = getClassColorHex(classItem.color)

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
        <span className="class-block__title">{classItem.title}</span>
        <span className="class-block__time">
          {formatClassTime(classItem.start_time)} - {formatClassTime(classItem.end_time)}
        </span>
        {classItem.location && (
          <span className="class-block__location">{classItem.location}</span>
        )}
      </div>
    </button>
  )
}
