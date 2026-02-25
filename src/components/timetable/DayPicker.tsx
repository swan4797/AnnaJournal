import { DAYS_OF_WEEK } from '~/utils/classes'

interface DayPickerProps {
  selectedDays: number[]
  onChange: (days: number[]) => void
  disabled?: boolean
}

export function DayPicker({ selectedDays, onChange, disabled }: DayPickerProps) {
  const toggleDay = (dayValue: number) => {
    if (disabled) return

    if (selectedDays.includes(dayValue)) {
      onChange(selectedDays.filter(d => d !== dayValue))
    } else {
      onChange([...selectedDays, dayValue].sort((a, b) => a - b))
    }
  }

  return (
    <div className="day-picker">
      {DAYS_OF_WEEK.map((day) => (
        <button
          key={day.value}
          type="button"
          className={`day-picker__btn ${selectedDays.includes(day.value) ? 'day-picker__btn--selected' : ''}`}
          onClick={() => toggleDay(day.value)}
          disabled={disabled}
          aria-pressed={selectedDays.includes(day.value)}
          title={day.label}
        >
          {day.short}
        </button>
      ))}
    </div>
  )
}
