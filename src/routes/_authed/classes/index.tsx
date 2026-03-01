import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React, { useState, useCallback } from 'react'
import {
  fetchClasses,
  createClass,
  deleteClass,
  getClassColorHex,
  formatClassDays,
  formatClassTime,
  type Class,
  type NewClass,
} from '~/utils/classes'
import { searchEvents, type Event } from '~/utils/events'
import { ClassForm, type ClassFormData } from '~/components/timetable'
import { Modal } from '~/components/ui'

export const Route = createFileRoute('/_authed/classes/')({
  loader: async () => {
    const [classesResult, examsResult] = await Promise.all([
      fetchClasses({}),
      searchEvents({
        data: {
          categories: ['exam'],
          startDate: new Date().toISOString(),
          limit: 20,
        },
      }),
    ])

    return {
      classes: classesResult.classes || [],
      exams: examsResult.events || [],
    }
  },
  component: ClassesPage,
})

function ClassesPage() {
  const { classes: initialClasses, exams } = Route.useLoaderData()
  const navigate = useNavigate()

  const [classes, setClasses] = useState<Class[]>(initialClasses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClassClick = useCallback((classId: string) => {
    navigate({ to: '/classes/$classId', params: { classId } })
  }, [navigate])

  const handleCreateNew = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const handleSubmit = useCallback(async (data: ClassFormData) => {
    setIsLoading(true)
    try {
      const newClass: Omit<NewClass, 'user_id'> = {
        title: data.title,
        module_code: data.module_code || null,
        module_name: data.module_name || null,
        instructor: data.instructor || null,
        location: data.location || null,
        days_of_week: data.days_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        semester_start: data.semester_start,
        semester_end: data.semester_end,
        color: data.color,
        description: data.description || null,
        linked_exam_id: data.linked_exam_id,
      }

      const result = await createClass({ data: newClass })
      if (result.class) {
        setClasses((prev) => [...prev, result.class!])
        handleCloseModal()
        // Navigate to the new class
        navigate({ to: '/classes/$classId', params: { classId: result.class.id } })
      }
    } finally {
      setIsLoading(false)
    }
  }, [handleCloseModal, navigate])

  // Calculate stats
  const totalSessions = classes.reduce((sum, c) => sum + c.days_of_week.length, 0)
  const activeClasses = classes.filter(c => {
    const now = new Date().toISOString().split('T')[0]
    return now >= c.semester_start && now <= c.semester_end
  }).length

  return (
    <div className="classes-page-v2">
      {/* Top Section: Summary + Scrolling Cards */}
      <div className="classes-page-v2__top">
        {/* Summary Card (Left) */}
        <div className="classes-summary-card">
          <div className="classes-summary-card__header">
            <div className="classes-summary-card__icon">
              <BookIcon />
            </div>
            <div className="classes-summary-card__info">
              <h2 className="classes-summary-card__title">My Classes</h2>
              <p className="classes-summary-card__subtitle">{classes.length} {classes.length === 1 ? 'class' : 'classes'} enrolled</p>
            </div>
            <button type="button" className="classes-summary-card__more">
              <MoreIcon />
            </button>
          </div>

          <div className="classes-summary-card__actions">
            <button type="button" className="classes-summary-card__action" onClick={() => navigate({ to: '/timetable' })}>
              <CalendarIcon />
            </button>
            <button type="button" className="classes-summary-card__action" onClick={() => navigate({ to: '/assignments' })}>
              <ClipboardIcon />
            </button>
            <button type="button" className="classes-summary-card__action" onClick={() => navigate({ to: '/notes' })}>
              <NotesIcon />
            </button>
            <button type="button" className="classes-summary-card__action" onClick={() => navigate({ to: '/exams' })}>
              <ExamIcon />
            </button>
          </div>

          <div className="classes-summary-card__stats">
            <div className="classes-summary-card__stat">
              <CalendarIcon />
              <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="classes-summary-card__stat classes-summary-card__stat--highlight">
              <span>Sessions</span>
              <span className="classes-summary-card__badge">{totalSessions}</span>
            </div>
          </div>
        </div>

        {/* Scrolling Classes Cards (Right) */}
        <div className="classes-cards-section">
          <div className="classes-cards-section__header">
            <button type="button" className="classes-cards-section__toggle">
              <span>Ongoing Classes</span>
              <ChevronDownIcon />
            </button>
            <div className="classes-cards-section__actions">
              <button type="button" className="classes-cards-section__action-btn" onClick={handleCreateNew}>
                <PlusIcon />
              </button>
              <button type="button" className="classes-cards-section__action-btn">
                <FilterIcon />
              </button>
              <button type="button" className="classes-cards-section__action-btn classes-cards-section__action-btn--active">
                <HeartIcon />
              </button>
            </div>
          </div>

          <div className="classes-cards-section__scroll">
            {classes.length === 0 ? (
              <div className="classes-cards-section__empty">
                <EmptyIcon />
                <span>No classes yet</span>
                <button type="button" onClick={handleCreateNew}>Add your first class</button>
              </div>
            ) : (
              classes.map((classItem, index) => (
                <ProjectStyleCard
                  key={classItem.id}
                  classItem={classItem}
                  colorIndex={index}
                  onClick={() => handleClassClick(classItem.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: 3-Column Grid */}
      <div className="classes-page-v2__bottom">
        {/* Detailed Information */}
        <div className="classes-detail-card">
          <div className="classes-detail-card__header">
            <h3 className="classes-detail-card__title">Detailed Information</h3>
          </div>
          <div className="classes-detail-card__content">
            <div className="classes-detail-card__row">
              <span className="classes-detail-card__dot" />
              <div className="classes-detail-card__info">
                <span className="classes-detail-card__label">Total Classes</span>
                <span className="classes-detail-card__value">{classes.length} enrolled</span>
              </div>
              <span className="classes-detail-card__status">Active</span>
            </div>
            <div className="classes-detail-card__row">
              <span className="classes-detail-card__dot" />
              <div className="classes-detail-card__info">
                <span className="classes-detail-card__label">Active This Semester</span>
                <span className="classes-detail-card__value">{activeClasses} classes running</span>
              </div>
              <span className="classes-detail-card__icon"><CalendarIcon /></span>
            </div>
            <div className="classes-detail-card__row">
              <span className="classes-detail-card__dot" />
              <div className="classes-detail-card__info">
                <span className="classes-detail-card__label">Weekly Sessions</span>
                <span className="classes-detail-card__value">{totalSessions} sessions per week</span>
              </div>
              <span className="classes-detail-card__icon"><ClockIcon /></span>
            </div>
            <div className="classes-detail-card__row">
              <span className="classes-detail-card__dot" />
              <div className="classes-detail-card__info">
                <span className="classes-detail-card__label">Upcoming Exams</span>
                <span className="classes-detail-card__value">{exams.length} scheduled</span>
              </div>
              <span className="classes-detail-card__icon"><ExamIcon /></span>
            </div>
            <div className="classes-detail-card__row">
              <span className="classes-detail-card__dot" />
              <div className="classes-detail-card__info">
                <span className="classes-detail-card__label">View Timetable</span>
                <span className="classes-detail-card__value">See your weekly schedule</span>
              </div>
              <button type="button" className="classes-detail-card__link" onClick={() => navigate({ to: '/timetable' })}>
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Overview */}
        <div className="classes-schedule-card">
          <div className="classes-schedule-card__header">
            <h3 className="classes-schedule-card__title">Schedule</h3>
            <button type="button" className="classes-schedule-card__icon" onClick={() => navigate({ to: '/timetable' })}>
              <CalendarIcon />
            </button>
          </div>
          <div className="classes-schedule-card__content">
            {classes.slice(0, 4).map((classItem) => (
              <button
                key={classItem.id}
                type="button"
                className="classes-schedule-card__item"
                onClick={() => handleClassClick(classItem.id)}
              >
                <div
                  className="classes-schedule-card__color"
                  style={{ backgroundColor: getClassColorHex(classItem.color) }}
                />
                <div className="classes-schedule-card__info">
                  <span className="classes-schedule-card__name">{classItem.title}</span>
                  <span className="classes-schedule-card__time">
                    {formatClassDays(classItem.days_of_week)} • {formatClassTime(classItem.start_time)}
                  </span>
                </div>
              </button>
            ))}
            {classes.length === 0 && (
              <div className="classes-schedule-card__empty">
                <CalendarIcon />
                <span>No schedule yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="classes-exams-card">
          <div className="classes-exams-card__header">
            <h3 className="classes-exams-card__title">Exams</h3>
            <span className="classes-exams-card__badge"><ExamIcon /></span>
          </div>
          <div className="classes-exams-card__content">
            {exams.slice(0, 4).map((exam) => (
              <button
                key={exam.id}
                type="button"
                className="classes-exams-card__item"
                onClick={() => navigate({ to: '/exams' })}
              >
                <div className="classes-exams-card__avatar">
                  <BookIcon />
                </div>
                <div className="classes-exams-card__info">
                  <span className="classes-exams-card__name">{exam.title}</span>
                  <span className="classes-exams-card__date">
                    {new Date(exam.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <span className="classes-exams-card__action">
                  <ChevronRightIcon />
                </span>
              </button>
            ))}
            {exams.length === 0 && (
              <div className="classes-exams-card__empty">
                <ExamIcon />
                <span>No upcoming exams</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="New Class"
        size="lg"
      >
        <ClassForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          submitLabel="Create Class"
          loading={isLoading}
          exams={exams}
        />
      </Modal>
    </div>
  )
}

// Project Style Card Component (horizontal scrolling cards)
interface ProjectStyleCardProps {
  classItem: Class
  colorIndex: number
  onClick: () => void
}

// Get card background color based on index (like in design)
function getProjectCardColor(index: number): string {
  const colors = ['yellow', 'pink', 'mint']
  return colors[index % colors.length]
}

// Calculate status for semester
function getSemesterStatus(semesterStart: string, semesterEnd: string): string {
  const now = new Date()
  const start = new Date(semesterStart)
  const end = new Date(semesterEnd)
  now.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  if (now < start) {
    const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return `${diffDays} Days Left`
  }
  if (now > end) return 'Completed'
  return 'In Progress'
}

// Calculate progress percentage
function getProgressPercent(semesterStart: string, semesterEnd: string): number {
  const now = new Date()
  const start = new Date(semesterStart)
  const end = new Date(semesterEnd)

  if (now < start) return 0
  if (now > end) return 100

  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()
  return Math.round((elapsed / total) * 100)
}

function ProjectStyleCard({ classItem, colorIndex, onClick }: ProjectStyleCardProps) {
  const cardColor = getProjectCardColor(colorIndex)
  const status = getSemesterStatus(classItem.semester_start, classItem.semester_end)
  const progress = getProgressPercent(classItem.semester_start, classItem.semester_end)
  const startDate = new Date(classItem.semester_start).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

  return (
    <button
      type="button"
      className={`project-style-card project-style-card--${cardColor}`}
      onClick={onClick}
    >
      <div className="project-style-card__date">
        <span>{startDate}</span>
        <button type="button" className="project-style-card__menu" onClick={(e) => e.stopPropagation()}>
          <MoreIcon />
        </button>
      </div>
      <h4 className="project-style-card__title">{classItem.title}</h4>
      <p className="project-style-card__desc">{classItem.module_name || classItem.location || 'Scheduled'}</p>
      <div className="project-style-card__progress">
        <div className="project-style-card__progress-fill" style={{ width: `${progress}%` }} />
        <span className="project-style-card__progress-label">{progress}%</span>
        <span className="project-style-card__progress-badge">Progress</span>
      </div>
      <div className="project-style-card__footer">
        <div className="project-style-card__avatars">
          <div className="project-style-card__avatar">
            <UserIcon />
          </div>
          {classItem.instructor && (
            <div className="project-style-card__avatar project-style-card__avatar--more">+</div>
          )}
        </div>
        <span className="project-style-card__status">{status}</span>
      </div>
    </button>
  )
}

// Icons
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function EmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="4" x2="9" y2="22" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="18" r="2" />
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

function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function ExamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
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

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
