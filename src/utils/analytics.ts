import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase'
import type { Event } from './events'

export interface DailyStudyData {
  date: string
  minutes: number
  sessions: number
}

export interface ExamStudyData {
  examId: string
  examTitle: string
  examDate: string
  totalMinutes: number
  sessionCount: number
  topicCount: number
  completedTopics: number
  avgConfidence: number
}

export interface StudyStreak {
  current: number
  longest: number
  lastStudyDate: string | null
}

export interface OverallStats {
  totalSessions: number
  totalMinutes: number
  avgSessionMinutes: number
  totalExams: number
  studyStreak: StudyStreak
}

/**
 * Fetch study analytics for a date range
 */
export const fetchStudyAnalytics = createServerFn({ method: 'GET' })
  .inputValidator((data: { startDate: string; endDate: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { error: 'Not authenticated' }
    }

    // Fetch all study sessions in range
    const { data: sessions, error: sessionsError } = await supabase
      .from('events')
      .select('*')
      .eq('category', 'study')
      .gte('start_time', data.startDate)
      .lte('start_time', data.endDate)
      .order('start_time', { ascending: true })

    if (sessionsError) {
      return { error: sessionsError.message }
    }

    // Calculate daily study data
    const dailyMap = new Map<string, { minutes: number; sessions: number }>()

    for (const session of sessions || []) {
      const date = session.start_time.split('T')[0]
      const existing = dailyMap.get(date) || { minutes: 0, sessions: 0 }

      let minutes = 0
      if (session.end_time) {
        const start = new Date(session.start_time)
        const end = new Date(session.end_time)
        minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      }

      dailyMap.set(date, {
        minutes: existing.minutes + minutes,
        sessions: existing.sessions + 1,
      })
    }

    const dailyData: DailyStudyData[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      minutes: data.minutes,
      sessions: data.sessions,
    }))

    return { dailyData, sessions: sessions || [], error: null }
  })

/**
 * Fetch study data grouped by exam
 */
export const fetchExamStudyStats = createServerFn({ method: 'GET' })
  .inputValidator((data?: { examIds?: string[] }) => data || {})
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { examStats: [], error: 'Not authenticated' }
    }

    // Fetch all exams
    let examsQuery = supabase
      .from('events')
      .select('*')
      .eq('category', 'exam')
      .order('start_time', { ascending: true })

    if (data?.examIds && data.examIds.length > 0) {
      examsQuery = examsQuery.in('id', data.examIds)
    }

    const { data: exams, error: examsError } = await examsQuery

    if (examsError) {
      return { examStats: [], error: examsError.message }
    }

    const examStats: ExamStudyData[] = []

    for (const exam of exams || []) {
      // Fetch study sessions for this exam
      const { data: sessions } = await supabase
        .from('events')
        .select('*')
        .eq('linked_exam_id', exam.id)
        .eq('category', 'study')

      // Fetch topics for this exam
      const { data: topics } = await supabase
        .from('exam_topics')
        .select('*')
        .eq('event_id', exam.id)

      let totalMinutes = 0
      for (const session of sessions || []) {
        if (session.end_time) {
          const start = new Date(session.start_time)
          const end = new Date(session.end_time)
          totalMinutes += Math.round((end.getTime() - start.getTime()) / (1000 * 60))
        }
      }

      const completedTopics = (topics || []).filter(t => t.completed).length
      const avgConfidence = topics && topics.length > 0
        ? Math.round((topics.reduce((sum, t) => sum + (t.confidence || 0), 0) / topics.length) * 10) / 10
        : 0

      examStats.push({
        examId: exam.id,
        examTitle: exam.title,
        examDate: exam.start_time,
        totalMinutes,
        sessionCount: sessions?.length || 0,
        topicCount: topics?.length || 0,
        completedTopics,
        avgConfidence,
      })
    }

    return { examStats, error: null }
  })

/**
 * Fetch overall study statistics
 */
export const fetchOverallStats = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { stats: null, error: 'Not authenticated' }
    }

    // Fetch all study sessions
    const { data: sessions, error } = await supabase
      .from('events')
      .select('*')
      .eq('category', 'study')
      .order('start_time', { ascending: false })

    if (error) {
      return { stats: null, error: error.message }
    }

    // Fetch exam count
    const { count: examCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'exam')

    // Calculate totals
    let totalMinutes = 0
    const studyDates = new Set<string>()

    for (const session of sessions || []) {
      if (session.end_time) {
        const start = new Date(session.start_time)
        const end = new Date(session.end_time)
        totalMinutes += Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      }
      studyDates.add(session.start_time.split('T')[0])
    }

    // Calculate streak
    const sortedDates = Array.from(studyDates).sort().reverse()
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Check if studied today or yesterday to start counting
    if (sortedDates.length > 0 && (sortedDates[0] === today || sortedDates[0] === yesterday)) {
      for (let i = 0; i < sortedDates.length; i++) {
        const date = new Date(sortedDates[i])
        const expectedDate = new Date(sortedDates[0])
        expectedDate.setDate(expectedDate.getDate() - i)

        if (date.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const curr = new Date(sortedDates[i])
        const prev = new Date(sortedDates[i - 1])
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)

        if (diffDays === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    const stats: OverallStats = {
      totalSessions: sessions?.length || 0,
      totalMinutes,
      avgSessionMinutes: sessions && sessions.length > 0
        ? Math.round(totalMinutes / sessions.length)
        : 0,
      totalExams: examCount || 0,
      studyStreak: {
        current: currentStreak,
        longest: longestStreak,
        lastStudyDate: sortedDates[0] || null,
      },
    }

    return { stats, error: null }
  })

/**
 * Format minutes as readable time
 */
export function formatTime(minutes: number): string {
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
