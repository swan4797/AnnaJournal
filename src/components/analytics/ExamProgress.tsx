import type { ExamStudyData } from '~/utils/analytics'
import { formatTime } from '~/utils/analytics'

interface ExamProgressProps {
  examStats: ExamStudyData[]
}

export function ExamProgress({ examStats }: ExamProgressProps) {
  // Sort by exam date (upcoming first)
  const sortedStats = [...examStats].sort(
    (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  )

  // Filter to upcoming exams only
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingExams = sortedStats.filter(
    (exam) => new Date(exam.examDate) >= today
  )

  if (upcomingExams.length === 0) {
    return (
      <div className="exam-progress">
        <h4 className="exam-progress__title">Exam Preparation</h4>
        <p className="exam-progress__empty">No upcoming exams</p>
      </div>
    )
  }

  // Find max study time for scaling
  const maxMinutes = Math.max(...upcomingExams.map((e) => e.totalMinutes), 60)

  return (
    <div className="exam-progress">
      <h4 className="exam-progress__title">Exam Preparation</h4>

      <div className="exam-progress__list">
        {upcomingExams.map((exam) => {
          const examDate = new Date(exam.examDate)
          const daysUntil = Math.ceil(
            (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          const progressPercent =
            exam.topicCount > 0
              ? Math.round((exam.completedTopics / exam.topicCount) * 100)
              : 0
          const studyBarWidth =
            maxMinutes > 0 ? (exam.totalMinutes / maxMinutes) * 100 : 0

          return (
            <div key={exam.examId} className="exam-progress__item">
              <div className="exam-progress__item-header">
                <span className="exam-progress__item-title">{exam.examTitle}</span>
                <span
                  className={`exam-progress__item-countdown ${
                    daysUntil <= 3
                      ? 'exam-progress__item-countdown--urgent'
                      : daysUntil <= 7
                        ? 'exam-progress__item-countdown--soon'
                        : ''
                  }`}
                >
                  {daysUntil === 0
                    ? 'Today'
                    : daysUntil === 1
                      ? 'Tomorrow'
                      : `${daysUntil} days`}
                </span>
              </div>

              <div className="exam-progress__item-stats">
                <div className="exam-progress__item-stat">
                  <ClockIcon />
                  <span>{formatTime(exam.totalMinutes)} studied</span>
                </div>
                <div className="exam-progress__item-stat">
                  <CheckIcon />
                  <span>
                    {exam.completedTopics}/{exam.topicCount} topics
                  </span>
                </div>
                {exam.avgConfidence > 0 && (
                  <div className="exam-progress__item-stat">
                    <StarIcon />
                    <span>{exam.avgConfidence.toFixed(1)} avg confidence</span>
                  </div>
                )}
              </div>

              <div className="exam-progress__item-bars">
                <div className="exam-progress__bar">
                  <div className="exam-progress__bar-label">Study Time</div>
                  <div className="exam-progress__bar-track">
                    <div
                      className="exam-progress__bar-fill exam-progress__bar-fill--study"
                      style={{ width: `${studyBarWidth}%` }}
                    />
                  </div>
                </div>
                <div className="exam-progress__bar">
                  <div className="exam-progress__bar-label">Topics</div>
                  <div className="exam-progress__bar-track">
                    <div
                      className="exam-progress__bar-fill exam-progress__bar-fill--topics"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="exam-progress__bar-percent">{progressPercent}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  )
}
