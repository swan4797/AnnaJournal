import { useState, useRef, useEffect } from 'react'
import { ConfidenceRating } from './ConfidenceRating'
import type { ExamTopic } from '~/utils/topics'

interface TopicItemProps {
  topic: ExamTopic
  onToggleComplete: (completed: boolean) => void
  onUpdateConfidence: (confidence: number) => void
  onUpdateName: (name: string) => void
  onDelete: () => void
}

export function TopicItem({
  topic,
  onToggleComplete,
  onUpdateConfidence,
  onUpdateName,
  onDelete,
}: TopicItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(topic.topic_name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSubmitName = () => {
    const trimmedName = editName.trim()
    if (trimmedName && trimmedName !== topic.topic_name) {
      onUpdateName(trimmedName)
    } else {
      setEditName(topic.topic_name)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitName()
    } else if (e.key === 'Escape') {
      setEditName(topic.topic_name)
      setIsEditing(false)
    }
  }

  return (
    <div className={`topic-item ${topic.completed ? 'topic-item--completed' : ''}`}>
      <label className="topic-item__checkbox">
        <input
          type="checkbox"
          checked={topic.completed || false}
          onChange={(e) => onToggleComplete(e.target.checked)}
        />
        <span className="topic-item__checkmark">
          {topic.completed && <CheckIcon />}
        </span>
      </label>

      <div className="topic-item__content">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="topic-item__input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSubmitName}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span
            className="topic-item__name"
            onClick={() => setIsEditing(true)}
            title="Click to edit"
          >
            {topic.topic_name}
          </span>
        )}
      </div>

      <div className="topic-item__confidence">
        <ConfidenceRating
          value={topic.confidence || 0}
          onChange={onUpdateConfidence}
          size="sm"
        />
      </div>

      <button
        className="topic-item__delete"
        onClick={onDelete}
        title="Delete topic"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}
