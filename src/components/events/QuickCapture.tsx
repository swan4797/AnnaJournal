import { useState, type FormEvent } from 'react'
import { Button, Input } from '~/components/ui'
import { CATEGORY_LIST, type EventCategory, getCategoryConfig } from '~/utils/categories'
import { createEvent, type Event } from '~/utils/events'

interface QuickCaptureProps {
  selectedDate: Date
  onEventCreated: (event: Event) => void
}

export function QuickCapture({ selectedDate, onEventCreated }: QuickCaptureProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<EventCategory>('task')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)

    try {
      // Create event at 9 AM of the selected date
      const startTime = new Date(selectedDate)
      startTime.setHours(9, 0, 0, 0)

      const result = await createEvent({
        data: {
          title: title.trim(),
          category,
          start_time: startTime.toISOString(),
          all_day: category === 'deadline',
          priority: 'medium',
        },
      })

      if (result.event) {
        onEventCreated(result.event)
        setTitle('')
        setExpanded(false)
      }
    } catch (err) {
      console.error('Failed to create event:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedConfig = getCategoryConfig(category)

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="quick-capture__trigger"
      >
        <svg className="quick-capture__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Quick Add
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="quick-capture">
      <div className="quick-capture__content">
        {/* Title input */}
        <Input
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        {/* Category quick select */}
        <div className="quick-capture__categories">
          {CATEGORY_LIST.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`quick-capture__cat-btn quick-capture__cat-btn--${cat.value} ${category === cat.value ? 'quick-capture__cat-btn--active' : ''}`}
              title={cat.label}
            >
              {cat.icon}
            </button>
          ))}
        </div>

        {/* Selected category indicator */}
        <div className={`quick-capture__selected event-card--${category}`}>
          {selectedConfig.icon} {selectedConfig.label}
        </div>

        {/* Actions */}
        <div className="quick-capture__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setExpanded(false)
              setTitle('')
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={loading}
            disabled={!title.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </form>
  )
}
