import { useState, useCallback, useEffect } from 'react'
import { useTimer, formatTimerDisplay, type TimerStatus } from '~/hooks/useTimer'
import { createLinkedStudySession } from '~/utils/studySessions'
import type { Event } from '~/utils/events'

interface StudyTimerProps {
  exams: Event[]
  onSessionCreated?: (session: Event) => void
}

const FOCUS_PRESETS = [15, 25, 45, 60]
const BREAK_PRESETS = [5, 10, 15]

export function StudyTimer({ exams, onSessionCreated }: StudyTimerProps) {
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [focusDuration, setFocusDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const selectedExam = exams.find((e) => e.id === selectedExamId)

  const handleFocusComplete = useCallback(async () => {
    // Play notification sound (if supported)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus session complete!', {
        body: 'Great work! Time for a break.',
        icon: '/favicon.ico',
      })
    }

    // Create study session
    if (sessionStartTime) {
      const endTime = new Date()
      const title = selectedExam
        ? `Study: ${selectedExam.title}`
        : 'Focus Session'

      const result = await createLinkedStudySession({
        data: {
          examId: selectedExamId || '',
          title,
          start_time: sessionStartTime.toISOString(),
          end_time: endTime.toISOString(),
        },
      })

      if (result.session) {
        onSessionCreated?.(result.session)
      }
    }
  }, [sessionStartTime, selectedExamId, selectedExam, onSessionCreated])

  const handleBreakComplete = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Break over!', {
        body: 'Ready to focus again?',
        icon: '/favicon.ico',
      })
    }
  }, [])

  const timer = useTimer({
    focusDuration,
    breakDuration,
    onFocusComplete: handleFocusComplete,
    onBreakComplete: handleBreakComplete,
  })

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleStart = () => {
    setSessionStartTime(new Date())
    timer.start()
  }

  const handleReset = () => {
    setSessionStartTime(null)
    timer.reset()
  }

  const progress = timer.totalTime > 0
    ? ((timer.totalTime - timer.timeRemaining) / timer.totalTime) * 100
    : 0

  const getStatusLabel = (): string => {
    switch (timer.status) {
      case 'idle':
        return 'Ready to focus'
      case 'running':
        return timer.isBreak ? 'Break time' : 'Focusing...'
      case 'paused':
        return 'Paused'
      case 'completed':
        return 'Session complete!'
      default:
        return ''
    }
  }

  return (
    <div className={`study-timer ${timer.isBreak ? 'study-timer--break' : ''}`}>
      {/* Header */}
      <div className="study-timer__header">
        <h3 className="study-timer__title">
          {timer.isBreak ? 'Break Time' : 'Focus Timer'}
        </h3>
        <button
          className="study-timer__settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          disabled={timer.status === 'running'}
        >
          <SettingsIcon />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && timer.status !== 'running' && (
        <div className="study-timer__settings">
          <div className="study-timer__setting-group">
            <label className="study-timer__setting-label">Focus Duration</label>
            <div className="study-timer__presets">
              {FOCUS_PRESETS.map((mins) => (
                <button
                  key={mins}
                  className={`study-timer__preset ${focusDuration === mins ? 'study-timer__preset--active' : ''}`}
                  onClick={() => setFocusDuration(mins)}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
          <div className="study-timer__setting-group">
            <label className="study-timer__setting-label">Break Duration</label>
            <div className="study-timer__presets">
              {BREAK_PRESETS.map((mins) => (
                <button
                  key={mins}
                  className={`study-timer__preset ${breakDuration === mins ? 'study-timer__preset--active' : ''}`}
                  onClick={() => setBreakDuration(mins)}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exam Selector */}
      {!timer.isBreak && timer.status !== 'running' && (
        <div className="study-timer__exam-select">
          <label className="study-timer__exam-label">Link to exam:</label>
          <select
            className="study-timer__exam-dropdown"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            <option value="">No exam (general focus)</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Timer Display */}
      <div className="study-timer__display">
        <svg className="study-timer__progress-ring" viewBox="0 0 120 120">
          <circle
            className="study-timer__progress-bg"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="study-timer__progress-bar"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 54}
            strokeDashoffset={2 * Math.PI * 54 * (1 - progress / 100)}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="study-timer__time">
          {formatTimerDisplay(timer.timeRemaining)}
        </div>
        <div className="study-timer__status">{getStatusLabel()}</div>
      </div>

      {/* Sessions Counter */}
      <div className="study-timer__sessions">
        <span className="study-timer__sessions-count">{timer.sessionsCompleted}</span>
        <span className="study-timer__sessions-label">
          session{timer.sessionsCompleted !== 1 ? 's' : ''} completed
        </span>
      </div>

      {/* Controls */}
      <div className="study-timer__controls">
        {timer.status === 'idle' && (
          <button className="study-timer__btn study-timer__btn--primary" onClick={handleStart}>
            <PlayIcon />
            Start Focus
          </button>
        )}

        {timer.status === 'running' && (
          <button className="study-timer__btn study-timer__btn--secondary" onClick={timer.pause}>
            <PauseIcon />
            Pause
          </button>
        )}

        {timer.status === 'paused' && (
          <>
            <button className="study-timer__btn study-timer__btn--primary" onClick={timer.resume}>
              <PlayIcon />
              Resume
            </button>
            <button className="study-timer__btn study-timer__btn--danger" onClick={handleReset}>
              <ResetIcon />
              Reset
            </button>
          </>
        )}

        {timer.status === 'completed' && (
          <>
            <button className="study-timer__btn study-timer__btn--break" onClick={timer.startBreak}>
              <CoffeeIcon />
              Take Break
            </button>
            <button className="study-timer__btn study-timer__btn--primary" onClick={handleReset}>
              <PlayIcon />
              Continue
            </button>
          </>
        )}

        {timer.status === 'running' && timer.isBreak && (
          <button className="study-timer__btn study-timer__btn--secondary" onClick={timer.skipBreak}>
            <SkipIcon />
            Skip Break
          </button>
        )}
      </div>

      {/* Selected Exam Display */}
      {selectedExam && !timer.isBreak && (
        <div className="study-timer__linked-exam">
          <BookIcon />
          <span>Studying: {selectedExam.title}</span>
        </div>
      )}
    </div>
  )
}

// Icons
function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function CoffeeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8h1a4 4 0 010 8h-1" />
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  )
}

function SkipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,4 15,12 5,20" />
      <rect x="17" y="4" width="2" height="16" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}
