import { useState } from 'react'
import { SparklesIcon, BookOpenIcon, RefreshIcon, ChevronRightIcon } from './icons'

export interface StudyNote {
  id: string
  title: string
  subject: string
  date: string
  excerpt: string
}

export interface StudyQuestion {
  id: string
  question: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface AIStudyCardProps {
  recentNotes: StudyNote[]
  suggestedQuestions: StudyQuestion[]
  onRefreshQuestions?: () => void
  onNoteClick?: (noteId: string) => void
  onQuestionClick?: (questionId: string) => void
}

export function AIStudyCard({
  recentNotes,
  suggestedQuestions,
  onRefreshQuestions,
  onNoteClick,
  onQuestionClick,
}: AIStudyCardProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'questions'>('questions')

  return (
    <div className="dashboard-card dashboard-card--ai-study">
      <div className="dashboard-card__header">
        <h3 className="dashboard-card__title">
          <SparklesIcon />
          AI Study Assistant
        </h3>
        <div className="ai-study__tabs">
          <button
            className={`ai-study__tab ${activeTab === 'questions' ? 'ai-study__tab--active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Questions
          </button>
          <button
            className={`ai-study__tab ${activeTab === 'notes' ? 'ai-study__tab--active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Recent Notes
          </button>
        </div>
      </div>

      <div className="dashboard-card__content">
        {activeTab === 'questions' ? (
          <div className="ai-study__questions">
            <div className="ai-study__intro">
              <p>Based on your recent notes, here are some practice questions:</p>
              <button className="ai-study__refresh" onClick={onRefreshQuestions}>
                <RefreshIcon />
                Generate New
              </button>
            </div>
            {suggestedQuestions.length === 0 ? (
              <div className="dashboard-card__empty">
                <BookOpenIcon />
                <span>Add notes to generate questions</span>
              </div>
            ) : (
              <ul className="ai-study__question-list">
                {suggestedQuestions.map((q, index) => (
                  <li
                    key={q.id}
                    className="ai-study__question-item"
                    onClick={() => onQuestionClick?.(q.id)}
                  >
                    <span className="ai-study__question-number">{index + 1}</span>
                    <div className="ai-study__question-content">
                      <p className="ai-study__question-text">{q.question}</p>
                      <div className="ai-study__question-meta">
                        <span className="ai-study__question-topic">{q.topic}</span>
                        <span className={`ai-study__question-difficulty ai-study__question-difficulty--${q.difficulty}`}>
                          {q.difficulty}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="ai-study__notes">
            {recentNotes.length === 0 ? (
              <div className="dashboard-card__empty">
                <BookOpenIcon />
                <span>No recent notes</span>
              </div>
            ) : (
              <ul className="ai-study__notes-list">
                {recentNotes.map((note) => (
                  <li
                    key={note.id}
                    className="ai-study__note-item"
                    onClick={() => onNoteClick?.(note.id)}
                  >
                    <div className="ai-study__note-header">
                      <span className="ai-study__note-title">{note.title}</span>
                      <span className="ai-study__note-date">{note.date}</span>
                    </div>
                    <span className="ai-study__note-subject">{note.subject}</span>
                    <p className="ai-study__note-excerpt">{note.excerpt}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="ai-study__footer">
        <span className="ai-study__powered">
          <SparklesIcon />
          Powered by AI analysis of your notes
        </span>
      </div>
    </div>
  )
}
