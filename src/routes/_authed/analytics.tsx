import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  fetchStudyAnalytics,
  fetchExamStudyStats,
  fetchOverallStats,
  formatTime,
  type DailyStudyData,
  type ExamStudyData,
  type OverallStats,
} from '~/utils/analytics'
import {
  StatsCard,
  ActivityChart,
  ExamProgress,
  StreakDisplay,
} from '~/components/analytics'

export const Route = createFileRoute('/_authed/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const [dailyData, setDailyData] = useState<DailyStudyData[]>([])
  const [examStats, setExamStats] = useState<ExamStudyData[]>([])
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true)

      // Fetch last 30 days of study data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const [analyticsResult, examResult, statsResult] = await Promise.all([
        fetchStudyAnalytics({
          data: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
        fetchExamStudyStats({ data: {} }),
        fetchOverallStats(),
      ])

      if (analyticsResult.dailyData) {
        setDailyData(analyticsResult.dailyData)
      }

      if (examResult.examStats) {
        setExamStats(examResult.examStats)
      }

      if (statsResult.stats) {
        setOverallStats(statsResult.stats)
      }

      setIsLoading(false)
    }

    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="analytics-page">
        <div className="analytics-page__loading">
          <LoadingSpinner />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-page">
      <div className="analytics-page__header">
        <h1 className="analytics-page__title">Study Analytics</h1>
        <p className="analytics-page__subtitle">Track your study progress and habits</p>
      </div>

      {/* Overall Stats */}
      <div className="analytics-page__stats-grid">
        <StatsCard
          label="Total Study Time"
          value={formatTime(overallStats?.totalMinutes || 0)}
          icon={<ClockIcon />}
          variant="primary"
        />
        <StatsCard
          label="Study Sessions"
          value={overallStats?.totalSessions || 0}
          icon={<CalendarIcon />}
        />
        <StatsCard
          label="Avg Session"
          value={formatTime(overallStats?.avgSessionMinutes || 0)}
          icon={<AvgIcon />}
        />
        <StatsCard
          label="Upcoming Exams"
          value={overallStats?.totalExams || 0}
          icon={<ExamIcon />}
        />
      </div>

      {/* Streak and Activity */}
      <div className="analytics-page__row">
        <div className="analytics-page__streak-section">
          {overallStats?.studyStreak && (
            <StreakDisplay streak={overallStats.studyStreak} />
          )}
        </div>
        <div className="analytics-page__activity-section">
          <ActivityChart data={dailyData} days={14} />
        </div>
      </div>

      {/* Exam Progress */}
      <div className="analytics-page__exam-section">
        <ExamProgress examStats={examStats} />
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function AvgIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function ExamIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
