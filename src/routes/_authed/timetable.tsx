import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback, useEffect } from 'react'
import {
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
  fetchClassExceptions,
  type Class,
  type ClassException,
  type NewClass,
  type UpdateClass,
} from '~/utils/classes'
import { searchEvents, type Event } from '~/utils/events'
import { fetchNotesByClass, type Note } from '~/utils/notes'
import {
  TimetableGrid,
  ClassForm,
  ClassDetail,
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
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [exceptions, setExceptions] = useState<ClassException[]>([])
  const [linkedNotes, setLinkedNotes] = useState<Note[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [initialFormData, setInitialFormData] = useState<{ dayOfWeek?: number; hour?: number }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Fetch exceptions and linked notes when a class is selected
  useEffect(() => {
    if (selectedClass) {
      // Fetch exceptions
      fetchClassExceptions({ data: { classId: selectedClass.id } }).then((result) => {
        setExceptions(result.exceptions || [])
      })
      // Fetch linked notes
      fetchNotesByClass({ data: { classId: selectedClass.id } }).then((result) => {
        setLinkedNotes(result.notes || [])
      })
    } else {
      setExceptions([])
      setLinkedNotes([])
    }
  }, [selectedClass?.id])

  const handleClassClick = useCallback((classItem: Class) => {
    setSelectedClass(classItem)
    setIsEditing(false)
  }, [])

  const handleAddClass = useCallback((dayOfWeek: number, hour: number) => {
    setSelectedClass(null)
    setInitialFormData({ dayOfWeek, hour })
    setIsEditing(false)
    setIsModalOpen(true)
  }, [])

  const handleCreateNew = useCallback(() => {
    setSelectedClass(null)
    setInitialFormData({})
    setIsEditing(false)
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setIsEditing(false)
    setInitialFormData({})
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedClass(null)
  }, [])

  const handleNoteClick = useCallback((noteId: string) => {
    navigate({ to: '/notes', search: { id: noteId } })
  }, [navigate])

  const handleSubmit = useCallback(async (data: ClassFormData) => {
    setIsLoading(true)
    try {
      if (isEditing && selectedClass) {
        // Update existing class
        const updates: UpdateClass = {
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

        const result = await updateClass({ data: { id: selectedClass.id, updates } })
        if (result.class) {
          setClasses((prev) =>
            prev.map((c) => (c.id === result.class!.id ? result.class! : c))
          )
          setSelectedClass(result.class)
        }
      } else {
        // Create new class
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
          setSelectedClass(result.class)
        }
      }
      handleCloseModal()
    } finally {
      setIsLoading(false)
    }
  }, [isEditing, selectedClass, handleCloseModal])

  const handleDelete = useCallback(async () => {
    if (!selectedClass) return

    if (!window.confirm('Delete this class? This will also remove all generated calendar events.')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteClass({ data: { id: selectedClass.id } })
      if (result.success) {
        setClasses((prev) => prev.filter((c) => c.id !== selectedClass.id))
        setSelectedClass(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedClass])

  // Find linked exam for selected class
  const linkedExam = selectedClass?.linked_exam_id
    ? exams.find((e) => e.id === selectedClass.linked_exam_id)
    : undefined

  // Prepare initial data for form when editing
  const getInitialFormData = (): Partial<ClassFormData> | undefined => {
    if (isEditing && selectedClass) {
      return {
        title: selectedClass.title,
        module_code: selectedClass.module_code || '',
        module_name: selectedClass.module_name || '',
        instructor: selectedClass.instructor || '',
        location: selectedClass.location || '',
        days_of_week: selectedClass.days_of_week,
        start_time: selectedClass.start_time,
        end_time: selectedClass.end_time,
        semester_start: selectedClass.semester_start,
        semester_end: selectedClass.semester_end,
        color: selectedClass.color || 'blue',
        description: selectedClass.description || '',
        linked_exam_id: selectedClass.linked_exam_id,
      }
    }
    return undefined
  }

  return (
    <div className="timetable-page">
      {/* Header */}
      <div className="timetable-page__header">
        <h1 className="timetable-page__title">Timetable</h1>
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
        selectedClassId={selectedClass?.id}
        onClassClick={handleClassClick}
      />

      {/* Main content */}
      <div className="timetable-page__content">
        {/* Grid */}
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
              selectedClassId={selectedClass?.id}
              onClassClick={handleClassClick}
              onAddClass={handleAddClass}
            />
          )}
        </div>

        {/* Detail panel */}
        {selectedClass && (
          <div className="timetable-page__detail">
            <ClassDetail
              classItem={selectedClass}
              exceptions={exceptions}
              linkedExam={linkedExam}
              linkedNotes={linkedNotes}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClose={handleCloseDetail}
              onNoteClick={handleNoteClick}
            />
          </div>
        )}
      </div>

      {/* Modal for create/edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditing ? 'Edit Class' : 'New Class'}
        size="lg"
      >
        <ClassForm
          initialData={getInitialFormData()}
          initialDayOfWeek={initialFormData.dayOfWeek}
          initialHour={initialFormData.hour}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          submitLabel={isEditing ? 'Save Changes' : 'Create Class'}
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
