import { useState, useEffect, useCallback, useRef } from 'react'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'break' | 'completed'

export interface TimerState {
  status: TimerStatus
  timeRemaining: number // seconds
  totalTime: number // seconds
  isBreak: boolean
  sessionsCompleted: number
}

interface UseTimerOptions {
  focusDuration: number // minutes
  breakDuration: number // minutes
  longBreakDuration?: number // minutes
  sessionsBeforeLongBreak?: number
  onFocusComplete?: () => void
  onBreakComplete?: () => void
}

export function useTimer({
  focusDuration,
  breakDuration,
  longBreakDuration = 15,
  sessionsBeforeLongBreak = 4,
  onFocusComplete,
  onBreakComplete,
}: UseTimerOptions) {
  const [state, setState] = useState<TimerState>({
    status: 'idle',
    timeRemaining: focusDuration * 60,
    totalTime: focusDuration * 60,
    isBreak: false,
    sessionsCompleted: 0,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Update timer when duration changes (only when idle)
  useEffect(() => {
    if (state.status === 'idle' && !state.isBreak) {
      setState((prev) => ({
        ...prev,
        timeRemaining: focusDuration * 60,
        totalTime: focusDuration * 60,
      }))
    }
  }, [focusDuration, state.status, state.isBreak])

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.timeRemaining <= 1) {
        // Timer completed
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        if (prev.isBreak) {
          // Break completed, ready for next focus session
          onBreakComplete?.()
          return {
            ...prev,
            status: 'idle',
            timeRemaining: focusDuration * 60,
            totalTime: focusDuration * 60,
            isBreak: false,
          }
        } else {
          // Focus session completed
          onFocusComplete?.()
          const newSessionsCompleted = prev.sessionsCompleted + 1
          const isLongBreak = newSessionsCompleted % sessionsBeforeLongBreak === 0
          const nextBreakDuration = isLongBreak ? longBreakDuration : breakDuration

          return {
            ...prev,
            status: 'completed',
            timeRemaining: 0,
            sessionsCompleted: newSessionsCompleted,
          }
        }
      }

      return {
        ...prev,
        timeRemaining: prev.timeRemaining - 1,
      }
    })
  }, [focusDuration, breakDuration, longBreakDuration, sessionsBeforeLongBreak, onFocusComplete, onBreakComplete])

  const start = useCallback(() => {
    if (state.status === 'running') return

    startTimeRef.current = new Date()
    setState((prev) => ({ ...prev, status: 'running' }))

    intervalRef.current = setInterval(tick, 1000)
  }, [state.status, tick])

  const pause = useCallback(() => {
    if (state.status !== 'running') return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setState((prev) => ({ ...prev, status: 'paused' }))
  }, [state.status])

  const resume = useCallback(() => {
    if (state.status !== 'paused') return

    setState((prev) => ({ ...prev, status: 'running' }))
    intervalRef.current = setInterval(tick, 1000)
  }, [state.status, tick])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    startTimeRef.current = null
    setState({
      status: 'idle',
      timeRemaining: focusDuration * 60,
      totalTime: focusDuration * 60,
      isBreak: false,
      sessionsCompleted: state.sessionsCompleted,
    })
  }, [focusDuration, state.sessionsCompleted])

  const startBreak = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const isLongBreak = state.sessionsCompleted % sessionsBeforeLongBreak === 0
    const nextBreakDuration = isLongBreak ? longBreakDuration : breakDuration

    setState((prev) => ({
      ...prev,
      status: 'running',
      timeRemaining: nextBreakDuration * 60,
      totalTime: nextBreakDuration * 60,
      isBreak: true,
    }))

    intervalRef.current = setInterval(tick, 1000)
  }, [state.sessionsCompleted, sessionsBeforeLongBreak, longBreakDuration, breakDuration, tick])

  const skipBreak = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setState((prev) => ({
      ...prev,
      status: 'idle',
      timeRemaining: focusDuration * 60,
      totalTime: focusDuration * 60,
      isBreak: false,
    }))
  }, [focusDuration])

  const getElapsedTime = useCallback(() => {
    if (!startTimeRef.current) return 0
    return Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 1000)
  }, [])

  return {
    ...state,
    start,
    pause,
    resume,
    reset,
    startBreak,
    skipBreak,
    getElapsedTime,
    startTime: startTimeRef.current,
  }
}

export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
