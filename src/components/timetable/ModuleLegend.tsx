import type { Class } from '~/utils/classes'
import { getClassColorHex } from '~/utils/classes'

interface ModuleLegendProps {
  classes: Class[]
  selectedClassId?: string
  onClassClick?: (classItem: Class) => void
}

export function ModuleLegend({ classes, selectedClassId, onClassClick }: ModuleLegendProps) {
  if (classes.length === 0) {
    return null
  }

  // Get unique classes by ID (in case of duplicates)
  const uniqueClasses = classes.reduce((acc, classItem) => {
    if (!acc.find(c => c.id === classItem.id)) {
      acc.push(classItem)
    }
    return acc
  }, [] as Class[])

  return (
    <div className="module-legend">
      {uniqueClasses.map((classItem) => {
        const colorHex = getClassColorHex(classItem.color)
        const isSelected = selectedClassId === classItem.id

        return (
          <button
            key={classItem.id}
            type="button"
            className={`module-legend__item ${isSelected ? 'module-legend__item--selected' : ''}`}
            onClick={() => onClassClick?.(classItem)}
          >
            <span
              className="module-legend__dot"
              style={{ backgroundColor: colorHex }}
            />
            <span className="module-legend__label">
              {classItem.module_code || classItem.title}
            </span>
          </button>
        )
      })}
    </div>
  )
}
