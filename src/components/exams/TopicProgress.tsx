import type { ExamTopic } from '~/utils/topics'

interface TopicProgressProps {
  topics: ExamTopic[]
}

export function TopicProgress({ topics }: TopicProgressProps) {
  if (topics.length === 0) {
    return null
  }

  const completedCount = topics.filter((t) => t.completed).length
  const totalCount = topics.length
  const completionPercent = Math.round((completedCount / totalCount) * 100)

  // Calculate average confidence (only for topics with confidence > 0)
  const topicsWithConfidence = topics.filter((t) => t.confidence > 0)
  const avgConfidence = topicsWithConfidence.length > 0
    ? topicsWithConfidence.reduce((sum, t) => sum + t.confidence, 0) / topicsWithConfidence.length
    : 0

  const getProgressColor = () => {
    if (completionPercent >= 80) return 'topic-progress__bar--high'
    if (completionPercent >= 50) return 'topic-progress__bar--medium'
    return 'topic-progress__bar--low'
  }

  const getConfidenceLabel = () => {
    if (avgConfidence === 0) return 'Not rated'
    if (avgConfidence <= 2) return 'Low confidence'
    if (avgConfidence <= 3) return 'Medium confidence'
    return 'High confidence'
  }

  return (
    <div className="topic-progress">
      <div className="topic-progress__stats">
        <span className="topic-progress__count">
          {completedCount}/{totalCount} topics
        </span>
        {avgConfidence > 0 && (
          <span className="topic-progress__confidence">
            {getConfidenceLabel()} ({avgConfidence.toFixed(1)})
          </span>
        )}
      </div>
      <div className="topic-progress__bar-container">
        <div
          className={`topic-progress__bar ${getProgressColor()}`}
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <span className="topic-progress__percent">{completionPercent}%</span>
    </div>
  )
}
