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

  return (
    <div className="classes-page">
      {/* Header */}
      <div className="classes-page__header">
        <div className="classes-page__header-left">
          <p className="classes-page__count">{classes.length} {classes.length === 1 ? 'class' : 'classes'} enrolled</p>
        </div>
        <button
          className="classes-page__add-btn"
          onClick={handleCreateNew}
        >
          <PlusIcon />
          <span>Add Class</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="classes-page__content">
        {classes.length === 0 ? (
          <div className="classes-page__empty">
            <EmptyIcon />
            <h3>No classes yet</h3>
            <p>Add your first class to get started with your timetable.</p>
            <button onClick={handleCreateNew}>Add Class</button>
          </div>
        ) : (
          <div className="classes-page__grid">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                onClick={() => handleClassClick(classItem.id)}
              />
            ))}
          </div>
        )}
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

// Class Card Component
interface ClassCardProps {
  classItem: Class
  onClick: () => void
}

// Map colors to gradient styles and category labels
function getCardStyle(color: string | null) {
  const colorMap: Record<string, { gradient: string; category: string }> = {
    blue: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', category: 'LECTURE' },
    green: { gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', category: 'LAB' },
    purple: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', category: 'SEMINAR' },
    orange: { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', category: 'WORKSHOP' },
    pink: { gradient: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)', category: 'TUTORIAL' },
    cyan: { gradient: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)', category: 'PRACTICAL' },
    amber: { gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', category: 'CLINICAL' },
    rose: { gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', category: 'STUDY' },
  }
  return colorMap[color || 'blue'] || colorMap.blue
}

// Calculate days until semester starts
function getDaysUntilStart(semesterStart: string): string {
  const start = new Date(semesterStart)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)

  const diffTime = start.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'In progress'
  if (diffDays === 0) return 'Starts today'
  if (diffDays === 1) return 'Starts tomorrow'
  return `Starts in ${diffDays} days`
}

function ClassCard({ classItem, onClick }: ClassCardProps) {
  const cardStyle = getCardStyle(classItem.color)
  const sessionsPerWeek = classItem.days_of_week.length

  return (
    <button
      className={`class-card-v2 class-card-v2--${classItem.color || 'blue'}`}
      onClick={onClick}
      style={{ background: cardStyle.gradient }}
    >
      <div className="class-card-v2__header">
        <span className="class-card-v2__category">
          {cardStyle.category}
          <CategoryDot />
        </span>
      </div>

      <div className="class-card-v2__body">
        <h3 className="class-card-v2__title">{classItem.title}</h3>

        {classItem.module_name && (
          <p className="class-card-v2__description">{classItem.module_name}</p>
        )}

        <div className="class-card-v2__stats">
          <span>{sessionsPerWeek} session{sessionsPerWeek !== 1 ? 's' : ''}/week</span>
          <span className="class-card-v2__stats-divider">|</span>
          <span>{formatClassTime(classItem.start_time)} - {formatClassTime(classItem.end_time)}</span>
        </div>

        {classItem.instructor && (
          <p className="class-card-v2__meta">
            <InstructorIcon />
            {classItem.instructor}
          </p>
        )}

        {classItem.location && (
          <p className="class-card-v2__meta">
            <LocationIcon />
            {classItem.location}
          </p>
        )}
      </div>

      <div className="class-card-v2__footer">
        <span className="class-card-v2__timing">{getDaysUntilStart(classItem.semester_start)}</span>
        <span className="class-card-v2__bookmark">
          <BookmarkIcon />
          <span>Saved</span>
        </span>
      </div>

      <div className="class-card-v2__decoration">
        <ClassDecoration color={classItem.color} />
      </div>
    </button>
  )
}

// Decorative element based on class type
function ClassDecoration({ color }: { color: string | null }) {
  // Different decorative shapes based on color/type
  const shapes: Record<string, React.ReactNode> = {
    blue: (
      <svg viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="35" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <circle cx="40" cy="40" r="25" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <circle cx="40" cy="40" r="15" fill="rgba(255,255,255,0.15)" />
      </svg>
    ),
    green: (
      <svg viewBox="0 0 80 80" fill="none">
        <rect x="10" y="10" width="60" height="60" rx="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <rect x="20" y="20" width="40" height="40" rx="4" fill="rgba(255,255,255,0.15)" />
      </svg>
    ),
    purple: (
      <svg viewBox="0 0 80 80" fill="none">
        <polygon points="40,5 75,60 5,60" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="rgba(255,255,255,0.1)" />
      </svg>
    ),
    orange: (
      <svg viewBox="0 0 80 80" fill="none">
        <path d="M40 10 L70 40 L40 70 L10 40 Z" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="rgba(255,255,255,0.1)" />
      </svg>
    ),
    pink: (
      <svg viewBox="0 0 80 80" fill="none">
        <ellipse cx="40" cy="40" rx="35" ry="25" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="rgba(255,255,255,0.1)" />
      </svg>
    ),
    cyan: (
      <svg viewBox="0 0 80 80" fill="none">
        <path d="M20 20 Q40 5 60 20 Q75 40 60 60 Q40 75 20 60 Q5 40 20 20" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="rgba(255,255,255,0.1)" />
      </svg>
    ),
    amber: (
      <svg viewBox="0 0 80 80" fill="none">
        <rect x="15" y="30" width="50" height="30" rx="4" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="rgba(255,255,255,0.15)" />
        <circle cx="55" cy="25" r="12" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      </svg>
    ),
    rose: (
      <svg viewBox="0 0 80 80" fill="none">
        <circle cx="30" cy="50" r="20" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="rgba(255,255,255,0.1)" />
        <circle cx="50" cy="35" r="15" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="rgba(255,255,255,0.08)" />
      </svg>
    ),
  }
  return shapes[color || 'blue'] || shapes.blue
}

// Icons
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
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="4" x2="9" y2="22" />
    </svg>
  )
}

function InstructorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function CategoryDot() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
      <circle cx="4" cy="4" r="4" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  )
}
