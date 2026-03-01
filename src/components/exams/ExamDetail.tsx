import { useState, useEffect } from 'react'
import type { Event } from '~/utils/events'
import { getCategoryConfig } from '~/utils/categories'
import { fetchEventFiles, getFileUrl } from '~/utils/files'
import { TopicList } from './TopicList'
import { StudySessionList } from './StudySessionList'
import type { ExamTopic } from '~/utils/topics'
import type { Tables } from '~/types/database'

type FileRecord = Tables<'files'>

interface ExamDetailProps {
  exam: Event
  topics: ExamTopic[]
  onTopicsChange: (topics: ExamTopic[]) => void
  studySessions: Event[]
  onStudySessionsChange: (sessions: Event[]) => void
  onStartStudySession: () => void
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

export function ExamDetail({
  exam,
  topics,
  onTopicsChange,
  studySessions,
  onStudySessionsChange,
  onStartStudySession,
  onEdit,
  onDelete,
  onClose,
}: ExamDetailProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const category = getCategoryConfig(exam.category)

  const examDate = new Date(exam.start_time)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Fetch attached files
  useEffect(() => {
    async function loadFiles() {
      const result = await fetchEventFiles({ data: { eventId: exam.id } })
      if (result.files) {
        setFiles(result.files)
        // Load file URLs
        const urls: Record<string, string> = {}
        for (const file of result.files) {
          const urlResult = await getFileUrl({ data: { filePath: file.file_path } })
          if (urlResult.url) {
            urls[file.id] = urlResult.url
          }
        }
        setFileUrls(urls)
      }
    }
    loadFiles()
  }, [exam.id])

  const formatFullDate = () => {
    return examDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = () => {
    if (exam.all_day) return 'All day'
    const start = examDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    if (exam.end_time) {
      const end = new Date(exam.end_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      return `${start} - ${end}`
    }
    return start
  }

  const formatDuration = () => {
    if (!exam.end_time || exam.all_day) return null
    const start = new Date(exam.start_time)
    const end = new Date(exam.end_time)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.round(diffMs / (1000 * 60))
    if (diffMins < 60) return `${diffMins} minutes`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return `${hours}h ${mins}m`
  }

  const getCountdownText = () => {
    if (daysUntil < 0) return 'This exam has passed'
    if (daysUntil === 0) return 'Exam is today!'
    if (daysUntil === 1) return 'Exam is tomorrow!'
    return `${daysUntil} days until exam`
  }

  const getCountdownClass = () => {
    if (daysUntil < 0) return 'exam-detail__countdown--past'
    if (daysUntil <= 2) return 'exam-detail__countdown--urgent'
    if (daysUntil <= 7) return 'exam-detail__countdown--soon'
    return ''
  }

  return (
    <div className="exam-detail">
      {/* Header */}
      <div className="exam-detail__header">
        <button type="button" className="exam-detail__close" onClick={onClose}>
          <CloseIcon />
        </button>
        <div className="exam-detail__actions">
          <button type="button" className="exam-detail__action exam-detail__action--edit" onClick={onEdit}>
            <EditIcon />
          </button>
          <button type="button" className="exam-detail__action exam-detail__action--danger" onClick={onDelete}>
            <DeleteIcon />
          </button>
        </div>
      </div>

      <div className="exam-detail__content">
        {/* Hero Section */}
        <div className="exam-detail__hero">
          <div className="exam-detail__hero-icon">
            <span>{category.icon}</span>
          </div>
          <div className="exam-detail__hero-content">
            <span className="exam-detail__category-badge">{category.label}</span>
            <h2 className="exam-detail__title">{exam.title}</h2>
            <div className={`exam-detail__countdown-badge ${getCountdownClass()}`}>
              <CountdownIcon />
              <span>{getCountdownText()}</span>
            </div>
          </div>
        </div>

        {/* Detailed Information Card */}
        <div className="exam-detail__info-card">
          <h3 className="exam-detail__card-title">Detailed Information</h3>
          <div className="exam-detail__info-rows">
            <div className="exam-detail__info-row">
              <div className="exam-detail__info-icon">
                <CalendarIcon />
              </div>
              <div className="exam-detail__info-content">
                <span className="exam-detail__info-label">Date</span>
                <span className="exam-detail__info-value">{formatFullDate()}</span>
              </div>
            </div>

            <div className="exam-detail__info-row">
              <div className="exam-detail__info-icon">
                <ClockIcon />
              </div>
              <div className="exam-detail__info-content">
                <span className="exam-detail__info-label">Time</span>
                <span className="exam-detail__info-value">{formatTime()}</span>
              </div>
            </div>

            {formatDuration() && (
              <div className="exam-detail__info-row">
                <div className="exam-detail__info-icon">
                  <DurationIcon />
                </div>
                <div className="exam-detail__info-content">
                  <span className="exam-detail__info-label">Duration</span>
                  <span className="exam-detail__info-value">{formatDuration()}</span>
                </div>
              </div>
            )}

            {exam.description && (
              <div className="exam-detail__info-row">
                <div className="exam-detail__info-icon">
                  <LocationIcon />
                </div>
                <div className="exam-detail__info-content">
                  <span className="exam-detail__info-label">Location</span>
                  <span className="exam-detail__info-value">{exam.description}</span>
                </div>
              </div>
            )}

            {exam.priority && (
              <div className="exam-detail__info-row">
                <div className="exam-detail__info-icon">
                  <PriorityIcon />
                </div>
                <div className="exam-detail__info-content">
                  <span className="exam-detail__info-label">Priority</span>
                  <span className={`exam-detail__priority-badge exam-detail__priority-badge--${exam.priority}`}>
                    {exam.priority.charAt(0).toUpperCase() + exam.priority.slice(1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes Card */}
        {exam.notes && (
          <div className="exam-detail__notes-card">
            <h3 className="exam-detail__card-title">Notes</h3>
            <div
              className="exam-detail__notes-content"
              dangerouslySetInnerHTML={{ __html: exam.notes }}
            />
          </div>
        )}

        {/* Files Card */}
        {files.length > 0 && (
          <div className="exam-detail__files-card">
            <h3 className="exam-detail__card-title">
              Attached Files
              <span className="exam-detail__files-count">{files.length}</span>
            </h3>
            <div className="exam-detail__files-list">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={fileUrls[file.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="exam-detail__file-item"
                >
                  <FileIcon />
                  <span className="exam-detail__file-name">{file.file_name}</span>
                  <DownloadIcon />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Study Topics Card */}
        <div className="exam-detail__topics-card">
          <h3 className="exam-detail__card-title">Study Topics</h3>
          <TopicList
            examId={exam.id}
            topics={topics}
            onTopicsChange={onTopicsChange}
          />
        </div>

        {/* Study Sessions Card */}
        <div className="exam-detail__sessions-card">
          <h3 className="exam-detail__card-title">Study Sessions</h3>
          <StudySessionList
            examId={exam.id}
            sessions={studySessions}
            onSessionsChange={onStudySessionsChange}
            onStartSession={onStartStudySession}
          />
        </div>
      </div>
    </div>
  )
}

// Icon Components
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

function DurationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function PriorityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  )
}

function CountdownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
