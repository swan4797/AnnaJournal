import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase'
import type { Event } from './events'

export interface StudyStats {
  totalSessions: number
  totalMinutes: number
  averageMinutes: number
}

/**
 * Fetch study sessions linked to a specific exam
 */
export const fetchExamStudySessions = createServerFn({ method: 'GET' })
  .inputValidator((data: { examId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { sessions: [], error: 'Not authenticated' }
    }

    const { data: sessions, error } = await supabase
      .from('events')
      .select('*')
      .eq('linked_exam_id', data.examId)
      .eq('category', 'study')
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching study sessions:', error)
      return { sessions: [], error: error.message }
    }

    return { sessions: sessions || [], error: null }
  })

/**
 * Link an existing study session to an exam
 */
export const linkStudySession = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string; examId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('events')
      .update({ linked_exam_id: data.examId })
      .eq('id', data.sessionId)
      .eq('user_id', user.user.id)

    if (error) {
      console.error('Error linking study session:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Unlink a study session from an exam
 */
export const unlinkStudySession = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('events')
      .update({ linked_exam_id: null })
      .eq('id', data.sessionId)
      .eq('user_id', user.user.id)

    if (error) {
      console.error('Error unlinking study session:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Create a new study session linked to an exam
 */
export const createLinkedStudySession = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      examId: string
      title: string
      start_time: string
      end_time?: string
      notes?: string
    }) => data
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { session: null, error: 'Not authenticated' }
    }

    const { data: session, error } = await supabase
      .from('events')
      .insert({
        user_id: user.user.id,
        category: 'study',
        title: data.title,
        start_time: data.start_time,
        end_time: data.end_time,
        notes: data.notes,
        linked_exam_id: data.examId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating study session:', error)
      return { session: null, error: error.message }
    }

    return { session, error: null }
  })

/**
 * Calculate study stats for an exam
 */
export function calculateStudyStats(sessions: Event[]): StudyStats {
  if (sessions.length === 0) {
    return { totalSessions: 0, totalMinutes: 0, averageMinutes: 0 }
  }

  let totalMinutes = 0

  for (const session of sessions) {
    if (session.start_time && session.end_time) {
      const start = new Date(session.start_time)
      const end = new Date(session.end_time)
      const diffMs = end.getTime() - start.getTime()
      const diffMins = Math.round(diffMs / (1000 * 60))
      if (diffMins > 0) {
        totalMinutes += diffMins
      }
    }
  }

  return {
    totalSessions: sessions.length,
    totalMinutes,
    averageMinutes: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
  }
}

/**
 * Format minutes as hours and minutes
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}
