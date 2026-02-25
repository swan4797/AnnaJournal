interface SubjectBadgeProps {
  subject: string
  onClick?: () => void
}

// Generate a consistent color from subject name
const getSubjectColor = (subject: string): string => {
  const colors = [
    'anatomy',
    'physiology',
    'biology',
    'chemistry',
    'psychology',
    'math',
    'english',
    'history',
  ]

  // Simple hash to pick color
  const hash = subject.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function SubjectBadge({ subject, onClick }: SubjectBadgeProps) {
  const colorClass = getSubjectColor(subject)

  return (
    <span
      className={`subject-badge subject-badge--${colorClass}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {subject}
    </span>
  )
}
