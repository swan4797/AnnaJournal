import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback, useEffect } from 'react'
import { searchEvents, deleteEvent, type Event } from '~/utils/events'
import { fetchExamTopics, type ExamTopic } from '~/utils/topics'
import { fetchExamStudySessions } from '~/utils/studySessions'
import { ExamCard, ExamDetail, StudySessionModal } from '~/components/exams'
import { CreateEventModal, EditEventModal } from '~/components/events/EventModal'

export const Route = createFileRoute('/_authed/exams')({
  loader: async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch exams from today onwards (next 90 days)
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 90)

    const result = await searchEvents({
      data: {
        categories: ['exam'],
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
      },
    })

    // Also fetch past exams (last 30 days) for archive section
    const pastStartDate = new Date(today)
    pastStartDate.setDate(pastStartDate.getDate() - 30)

    const pastResult = await searchEvents({
      data: {
        categories: ['exam'],
        startDate: pastStartDate.toISOString(),
        endDate: today.toISOString(),
      },
    })

    return {
      upcomingExams: result.events || [],
      pastExams: pastResult.events || [],
    }
  },
  component: ExamsPage,
})

function ExamsPage() {
  const { upcomingExams: initialUpcoming, pastExams: initialPast } = Route.useLoaderData()
  const navigate = useNavigate()

  const [upcomingExams, setUpcomingExams] = useState<Event[]>(initialUpcoming)
  const [pastExams, setPastExams] = useState<Event[]>(initialPast)
  const [selectedExam, setSelectedExam] = useState<Event | null>(null)
  const [selectedExamTopics, setSelectedExamTopics] = useState<ExamTopic[]>([])
  const [selectedExamSessions, setSelectedExamSessions] = useState<Event[]>([])
  const [showPastExams, setShowPastExams] = useState(false)

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isStudySessionModalOpen, setIsStudySessionModalOpen] = useState(false)

  // Fetch topics and study sessions when an exam is selected
  useEffect(() => {
    if (selectedExam) {
      fetchExamTopics({ data: { examId: selectedExam.id } }).then((result) => {
        setSelectedExamTopics(result.topics || [])
      })
      fetchExamStudySessions({ data: { examId: selectedExam.id } }).then((result) => {
        setSelectedExamSessions(result.sessions || [])
      })
    } else {
      setSelectedExamTopics([])
      setSelectedExamSessions([])
    }
  }, [selectedExam?.id])

  const handleExamClick = useCallback((exam: Event) => {
    setSelectedExam(exam)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedExam(null)
  }, [])

  const handleEventCreated = useCallback((event: Event) => {
    if (event.category === 'exam') {
      setUpcomingExams((prev) => [...prev, event].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ))
    }
  }, [])

  const handleEventUpdated = useCallback((updatedEvent: Event) => {
    setUpcomingExams((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    )
    setPastExams((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    )
    setSelectedExam(updatedEvent)
  }, [])

  const handleDeleteExam = useCallback(async () => {
    if (!selectedExam) return

    if (!confirm('Are you sure you want to delete this exam?')) return

    const result = await deleteEvent({ data: { id: selectedExam.id } })
    if (result.success) {
      setUpcomingExams((prev) => prev.filter((e) => e.id !== selectedExam.id))
      setPastExams((prev) => prev.filter((e) => e.id !== selectedExam.id))
      setSelectedExam(null)
    }
  }, [selectedExam])

  const handleStudySessionCreated = useCallback((session: Event) => {
    setSelectedExamSessions((prev) => [session, ...prev])
  }, [])

  const displayedExams = showPastExams ? pastExams : upcomingExams

  return (
    <div className="exams-page">
      {/* Header */}
      <div className="exams-page__header">
        <div className="exams-page__title-section">
          <h1 className="exams-page__title">Exams</h1>
          <p className="exams-page__subtitle">
            {upcomingExams.length} upcoming exam{upcomingExams.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="exams-page__add-btn"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <PlusIcon />
          Add Exam
        </button>
      </div>

      {/* Toggle between upcoming and past */}
      <div className="exams-page__tabs">
        <button
          className={`exams-page__tab ${!showPastExams ? 'exams-page__tab--active' : ''}`}
          onClick={() => setShowPastExams(false)}
        >
          Upcoming ({upcomingExams.length})
        </button>
        <button
          className={`exams-page__tab ${showPastExams ? 'exams-page__tab--active' : ''}`}
          onClick={() => setShowPastExams(true)}
        >
          Past ({pastExams.length})
        </button>
      </div>

      {/* Main content */}
      <div className="exams-page__content">
        {/* Exam list */}
        <div className="exams-page__list">
          {displayedExams.length === 0 ? (
            <div className="exams-page__empty">
              <EmptyIcon />
              <p>{showPastExams ? 'No past exams' : 'No upcoming exams'}</p>
              {!showPastExams && (
                <button
                  className="exams-page__empty-btn"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Add your first exam
                </button>
              )}
            </div>
          ) : (
            <div className="exams-page__cards">
              {displayedExams.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  isSelected={selectedExam?.id === exam.id}
                  onClick={() => handleExamClick(exam)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedExam && (
          <div className="exams-page__detail">
            <ExamDetail
              exam={selectedExam}
              topics={selectedExamTopics}
              onTopicsChange={setSelectedExamTopics}
              studySessions={selectedExamSessions}
              onStudySessionsChange={setSelectedExamSessions}
              onStartStudySession={() => setIsStudySessionModalOpen(true)}
              onEdit={() => setIsEditModalOpen(true)}
              onDelete={handleDeleteExam}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      {selectedExam && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          event={selectedExam}
          onEventUpdated={handleEventUpdated}
        />
      )}

      {selectedExam && (
        <StudySessionModal
          isOpen={isStudySessionModalOpen}
          examId={selectedExam.id}
          examTitle={selectedExam.title}
          onClose={() => setIsStudySessionModalOpen(false)}
          onSessionCreated={handleStudySessionCreated}
        />
      )}
    </div>
  )
}

// Icon Components
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function EmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
