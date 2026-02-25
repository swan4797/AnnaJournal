import { useState, useCallback } from 'react'
import { TopicItem } from './TopicItem'
import { TopicProgress } from './TopicProgress'
import {
  createExamTopic,
  updateExamTopic,
  deleteExamTopic,
  toggleTopicComplete,
  updateTopicConfidence,
  type ExamTopic,
} from '~/utils/topics'

interface TopicListProps {
  examId: string
  topics: ExamTopic[]
  onTopicsChange: (topics: ExamTopic[]) => void
}

export function TopicList({ examId, topics, onTopicsChange }: TopicListProps) {
  const [newTopicName, setNewTopicName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddTopic = useCallback(async () => {
    const trimmedName = newTopicName.trim()
    if (!trimmedName) return

    setIsAdding(true)
    const result = await createExamTopic({
      data: {
        event_id: examId,
        topic_name: trimmedName,
      },
    })

    if (result.topic) {
      onTopicsChange([...topics, result.topic])
      setNewTopicName('')
    }
    setIsAdding(false)
  }, [examId, newTopicName, topics, onTopicsChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      handleAddTopic()
    }
  }

  const handleToggleComplete = useCallback(
    async (topicId: string, completed: boolean) => {
      // Optimistic update
      onTopicsChange(
        topics.map((t) => (t.id === topicId ? { ...t, completed } : t))
      )

      const result = await toggleTopicComplete({
        data: { id: topicId, completed },
      })

      if (!result.success) {
        // Revert on error
        onTopicsChange(
          topics.map((t) => (t.id === topicId ? { ...t, completed: !completed } : t))
        )
      }
    },
    [topics, onTopicsChange]
  )

  const handleUpdateConfidence = useCallback(
    async (topicId: string, confidence: number) => {
      const originalTopic = topics.find((t) => t.id === topicId)
      if (!originalTopic) return

      // Optimistic update
      onTopicsChange(
        topics.map((t) => (t.id === topicId ? { ...t, confidence } : t))
      )

      const result = await updateTopicConfidence({
        data: { id: topicId, confidence },
      })

      if (!result.success) {
        // Revert on error
        onTopicsChange(
          topics.map((t) =>
            t.id === topicId ? { ...t, confidence: originalTopic.confidence } : t
          )
        )
      }
    },
    [topics, onTopicsChange]
  )

  const handleUpdateName = useCallback(
    async (topicId: string, topic_name: string) => {
      const originalTopic = topics.find((t) => t.id === topicId)
      if (!originalTopic) return

      // Optimistic update
      onTopicsChange(
        topics.map((t) => (t.id === topicId ? { ...t, topic_name } : t))
      )

      const result = await updateExamTopic({
        data: { id: topicId, updates: { topic_name } },
      })

      if (result.error) {
        // Revert on error
        onTopicsChange(
          topics.map((t) =>
            t.id === topicId ? { ...t, topic_name: originalTopic.topic_name } : t
          )
        )
      }
    },
    [topics, onTopicsChange]
  )

  const handleDelete = useCallback(
    async (topicId: string) => {
      const originalTopics = [...topics]

      // Optimistic update
      onTopicsChange(topics.filter((t) => t.id !== topicId))

      const result = await deleteExamTopic({ data: { id: topicId } })

      if (!result.success) {
        // Revert on error
        onTopicsChange(originalTopics)
      }
    },
    [topics, onTopicsChange]
  )

  return (
    <div className="topic-list">
      {topics.length > 0 && (
        <div className="topic-list__header">
          <TopicProgress topics={topics} />
        </div>
      )}

      <div className="topic-list__items">
        {topics.map((topic) => (
          <TopicItem
            key={topic.id}
            topic={topic}
            onToggleComplete={(completed) => handleToggleComplete(topic.id, completed)}
            onUpdateConfidence={(confidence) => handleUpdateConfidence(topic.id, confidence)}
            onUpdateName={(name) => handleUpdateName(topic.id, name)}
            onDelete={() => handleDelete(topic.id)}
          />
        ))}
      </div>

      <div className="topic-list__add">
        <input
          type="text"
          className="topic-list__input"
          placeholder="Add a topic..."
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAdding}
        />
        <button
          className="topic-list__add-btn"
          onClick={handleAddTopic}
          disabled={!newTopicName.trim() || isAdding}
        >
          {isAdding ? <SpinnerIcon /> : <PlusIcon />}
        </button>
      </div>

      {topics.length === 0 && (
        <p className="topic-list__empty">
          No topics yet. Add topics to track your study progress.
        </p>
      )}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}
