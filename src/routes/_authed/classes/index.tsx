import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
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
          <h1 className="classes-page__title">Classes</h1>
          <p className="classes-page__subtitle">{classes.length} classes this semester</p>
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

function ClassCard({ classItem, onClick }: ClassCardProps) {
  const colorHex = getClassColorHex(classItem.color)

  return (
    <button className="class-card" onClick={onClick}>
      <div className="class-card__color-bar" style={{ backgroundColor: colorHex }} />
      <div className="class-card__content">
        <div className="class-card__header">
          <h3 className="class-card__title">{classItem.title}</h3>
          {classItem.module_code && (
            <span className="class-card__code">{classItem.module_code}</span>
          )}
        </div>
        {classItem.module_name && (
          <p className="class-card__module">{classItem.module_name}</p>
        )}
        <div className="class-card__schedule">
          <span className="class-card__days">{formatClassDays(classItem.days_of_week)}</span>
          <span className="class-card__time">
            {formatClassTime(classItem.start_time)} - {formatClassTime(classItem.end_time)}
          </span>
        </div>
        {classItem.instructor && (
          <p className="class-card__instructor">
            <InstructorIcon />
            {classItem.instructor}
          </p>
        )}
        {classItem.location && (
          <p className="class-card__location">
            <LocationIcon />
            {classItem.location}
          </p>
        )}
      </div>
    </button>
  )
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
