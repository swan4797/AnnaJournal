export type CalendarView = 'month' | 'week' | 'day'

interface ViewSwitcherProps {
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
}

const views: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
]

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="view-switcher">
      {views.map((view) => (
        <button
          key={view.value}
          onClick={() => onViewChange(view.value)}
          className={`view-switcher__btn ${currentView === view.value ? 'view-switcher__btn--active' : ''}`}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
