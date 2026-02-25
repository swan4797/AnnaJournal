import { useState, useCallback } from 'react'
import type { Event } from '~/utils/events'
import {
  unlinkStudySession,
  calculateStudyStats,
  formatStudyTime,
} from '~/utils/studySessions'

interface StudySessionListProps {
  examId: string
  sessions: Event[]
  onSessionsChange: (sessions: Event[]) => void
  onStartSession: () => void
}

export function StudySessionList({
  examId,
  sessions,
  onSessionsChange,
  onStartSession,
}: StudySessionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const stats = calculateStudyStats(sessions)

  const handleUnlink = useCallback(
    async (sessionId: string) => {
      const originalSessions = [...sessions]

      // Optimistic update
      onSessionsChange(sessions.filter((s) => s.id !== sessionId))

      const result = await unlinkStudySession({ data: { sessionId } })

      if (!result.success) {
        // Revert on error
        onSessionsChange(originalSessions)
      }
    },
    [sessions, onSessionsChange]
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getSessionDuration = (session: Event) => {
    if (!session.end_time) return null
    const start = new Date(session.start_time)
    const end = new Date(session.end_time)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.round(diffMs / (1000 * 60))
    return formatStudyTime(diffMins)
  }

  return (
    <div className="study-session-list">
      {/* Stats header */}
      <div className="study-session-list__stats">
        <div className="study-session-list__stat">
          <span className="study-session-list__stat-value">{stats.totalSessions}</span>
          <span className="study-session-list__stat-label">Sessions</span>
        </div>
        <div className="study-session-list__stat">
          <span className="study-session-list__stat-value">
            {formatStudyTime(stats.totalMinutes)}
          </span>
          <span className="study-session-list__stat-label">Total Time</span>
        </div>
        <div className="study-session-list__stat">
          <span className="study-session-list__stat-value">
            {stats.averageMinutes > 0 ? formatStudyTime(stats.averageMinutes) : '-'}
          </span>
          <span className="study-session-list__stat-label">Avg/Session</span>
        </div>
      </div>

      {/* Session list */}
      <div className="study-session-list__items">
        {sessions.length === 0 ? (
          <p className="study-session-list__empty">
            No study sessions linked to this exam yet.
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`study-session-list__item ${
                expandedId === session.id ? 'study-session-list__item--expanded' : ''
              }`}
            >
              <div
                className="study-session-list__item-header"
                onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              >
                <div className="study-session-list__item-info">
                  <span className="study-session-list__item-title">{session.title}</span>
                  <span className="study-session-list__item-date">
                    {formatDate(session.start_time)}
                  </span>
                </div>
                <div className="study-session-list__item-meta">
                  {getSessionDuration(session) && (
                    <span className="study-session-list__item-duration">
                      {getSessionDuration(session)}
                    </span>
                  )}
                  <ChevronIcon expanded={expandedId === session.id} />
                </div>
              </div>

              {expandedId === session.id && (
                <div className="study-session-list__item-details">
                  <div className="study-session-list__item-time">
                    <ClockIcon />
                    {formatTime(session.start_time)}
                    {session.end_time && ` - ${formatTime(session.end_time)}`}
                  </div>
                  {session.notes && (
                    <div
                      className="study-session-list__item-notes"
                      dangerouslySetInnerHTML={{ __html: session.notes }}
                    />
                  )}
                  <button
                    className="study-session-list__unlink-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnlink(session.id)
                    }}
                  >
                    <UnlinkIcon />
                    Unlink from exam
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Start session button */}
      <button className="study-session-list__start-btn" onClick={onStartSession}>
        <PlayIcon />
        Start Study Session
      </button>
    </div>
  )
}

// Icon components
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    >
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

function UnlinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 007.07 7.07l1.71-1.71" />
      <line x1="8" y1="2" x2="8" y2="5" />
      <line x1="2" y1="8" x2="5" y2="8" />
      <line x1="16" y1="19" x2="16" y2="22" />
      <line x1="19" y1="16" x2="22" y2="16" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
    </svg>
  )
}
