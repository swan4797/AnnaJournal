import { useState, useCallback } from 'react'
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
        // Reset form
        setTitle(`Study: ${examTitle}`)
        setDuration('60')
      }
    },
    [examId, examTitle, title, duration, isSubmitting, onClose, onSessionCreated]
  )

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal study-session-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Start Study Session</h3>
          <button className="modal__close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__content">
          <div className="form-group">
            <label htmlFor="session-title" className="form-label">
              Session Title
            </label>
            <input
              id="session-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you studying?"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="session-duration" className="form-label">
              Planned Duration
            </label>
            <div className="study-session-modal__duration-options">
              {['30', '45', '60', '90', '120'].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`study-session-modal__duration-btn ${
                    duration === mins ? 'study-session-modal__duration-btn--active' : ''
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

          <div className="study-session-modal__info">
            <InfoIcon />
            <span>
              This will create a study session starting now, linked to "{examTitle}".
            </span>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Start Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
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
