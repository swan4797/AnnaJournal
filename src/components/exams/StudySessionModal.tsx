import { useState, useCallback, useEffect } from 'react'
import { Modal } from '~/components/ui'
import { createLinkedStudySession } from '~/utils/studySessions'
import type { Event } from '~/utils/events'

interface StudySessionModalProps {
  isOpen: boolean
  examId: string
  examTitle: string
  onClose: () => void
  onSessionCreated: (session: Event) => void
}

export function StudySessionModal({
  isOpen,
  examId,
  examTitle,
  onClose,
  onSessionCreated,
}: StudySessionModalProps) {
  const [title, setTitle] = useState(`Study: ${examTitle}`)
  const [duration, setDuration] = useState('60')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens with new exam
  useEffect(() => {
    if (isOpen) {
      setTitle(`Study: ${examTitle}`)
      setDuration('60')
    }
  }, [isOpen, examTitle])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim() || isSubmitting) return

      setIsSubmitting(true)

      const now = new Date()
      const durationMins = parseInt(duration, 10) || 60
      const endTime = new Date(now.getTime() + durationMins * 60 * 1000)

      const result = await createLinkedStudySession({
        data: {
          examId,
          title: title.trim(),
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
        },
      })

      setIsSubmitting(false)

      if (result.session) {
        onSessionCreated(result.session)
        onClose()
      }
    },
    [examId, title, duration, isSubmitting, onClose, onSessionCreated]
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start Study Session" size="sm">
      <form onSubmit={handleSubmit} className="study-session-form">
        <div className="study-session-form__group">
          <label htmlFor="session-title" className="study-session-form__label">
            Session Title
          </label>
          <input
            id="session-title"
            type="text"
            className="study-session-form__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you studying?"
            required
          />
        </div>

        <div className="study-session-form__group">
          <label className="study-session-form__label">Planned Duration</label>
          <div className="study-session-form__duration-options">
            {['30', '45', '60', '90', '120'].map((mins) => (
              <button
                key={mins}
                type="button"
                className={`study-session-form__duration-btn ${
                  duration === mins ? 'study-session-form__duration-btn--active' : ''
                }`}
                onClick={() => setDuration(mins)}
              >
                {parseInt(mins, 10) >= 60
                  ? `${Math.floor(parseInt(mins, 10) / 60)}h${
                      parseInt(mins, 10) % 60 > 0 ? ` ${parseInt(mins, 10) % 60}m` : ''
                    }`
                  : `${mins}m`}
              </button>
            ))}
          </div>
        </div>

        <div className="study-session-form__info">
          <InfoIcon />
          <span>
            This will create a study session starting now, linked to "{examTitle}".
          </span>
        </div>

        <div className="study-session-form__actions">
          <button type="button" className="study-session-form__btn study-session-form__btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="study-session-form__btn study-session-form__btn--primary"
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Start Session'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
