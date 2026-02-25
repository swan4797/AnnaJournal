import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import {
  fetchClasses,
  createClass,
  type Class,
  type NewClass,
} from '~/utils/classes'
import { searchEvents, type Event } from '~/utils/events'
import {
  TimetableGrid,
  ClassForm,
  ModuleLegend,
  type ClassFormData,
} from '~/components/timetable'
import { Modal } from '~/components/ui'

export const Route = createFileRoute('/_authed/timetable')({
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
  component: TimetablePage,
})

function TimetablePage() {
  const { classes: initialClasses, exams } = Route.useLoaderData()
  const navigate = useNavigate()

  const [classes, setClasses] = useState<Class[]>(initialClasses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialFormData, setInitialFormData] = useState<{ dayOfWeek?: number; hour?: number }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Navigate to class detail page when clicking a class
  const handleClassClick = useCallback((classItem: Class) => {
    navigate({ to: '/classes/$classId', params: { classId: classItem.id } })
  }, [navigate])

  const handleAddClass = useCallback((dayOfWeek: number, hour: number) => {
    setInitialFormData({ dayOfWeek, hour })
    setIsModalOpen(true)
  }, [])

  const handleCreateNew = useCallback(() => {
    setInitialFormData({})
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setInitialFormData({})
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
        // Navigate to the new class detail page
        navigate({ to: '/classes/$classId', params: { classId: result.class.id } })
      }
    } finally {
      setIsLoading(false)
    }
  }, [handleCloseModal, navigate])

  return (
    <div className="timetable-page">
      {/* Header */}
      <div className="timetable-page__header">
        <div className="timetable-page__header-left">
          <h1 className="timetable-page__title">Timetable</h1>
          <Link to="/classes" className="timetable-page__classes-link">
            View all classes
          </Link>
        </div>
        <button
          className="timetable-page__add-btn"
          onClick={handleCreateNew}
          title="Add Class"
        >
          <PlusIcon />
          <span>Add Class</span>
        </button>
      </div>

      {/* Legend */}
      <ModuleLegend
        classes={classes}
        onClassClick={handleClassClick}
      />

      {/* Main content - Grid only */}
      <div className="timetable-page__content">
        <div className="timetable-page__grid-wrapper">
          {classes.length === 0 ? (
            <div className="timetable-page__empty">
              <EmptyIcon />
              <p>No classes scheduled</p>
              <button onClick={handleCreateNew}>Add your first class</button>
            </div>
          ) : (
            <TimetableGrid
              classes={classes}
              onClassClick={handleClassClick}
              onAddClass={handleAddClass}
            />
          )}
        </div>
      </div>

      {/* Modal for creating new class */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="New Class"
        size="lg"
      >
        <ClassForm
          initialDayOfWeek={initialFormData.dayOfWeek}
          initialHour={initialFormData.hour}
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
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="4" x2="9" y2="22" />
      <line x1="15" y1="4" x2="15" y2="22" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </svg>
  )
}
