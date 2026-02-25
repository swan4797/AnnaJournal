import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback, useMemo } from 'react'
import {
  TodaysTasks,
  MiniCalendar,
  ExamsComingUp,
  ClassesToday,
  HomeworkComingUp,
  AIStudyCard,
  type Task,
  type Exam,
  type ClassSchedule,
  type Homework,
  type StudyNote,
  type StudyQuestion,
} from '~/components/dashboard'
import { searchEvents, toggleEventComplete, type Event } from '~/utils/events'
import { fetchClasses, formatClassTime, type Class } from '~/utils/classes'
import { fetchAssignments, updateAssignmentStatus, type Assignment } from '~/utils/assignments'
import { fetchNotes, type Note } from '~/utils/notes'

export const Route = createFileRoute('/_authed/dashboard')({
  loader: async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch exams from today onwards (next 30 days for dashboard)
    const examEndDate = new Date(today)
    examEndDate.setDate(examEndDate.getDate() + 30)

    // Calculate date range for calendar events (current month)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0) // 2 months ahead

    const [examsResult, classesResult, todayTasksResult, assignmentsResult, notesResult, calendarEventsResult] = await Promise.all([
      searchEvents({
        data: {
          categories: ['exam'],
          startDate: today.toISOString(),
          endDate: examEndDate.toISOString(),
          limit: 5,
        },
      }),
      fetchClasses({}),
      // Fetch today's tasks (task, homework, deadline categories)
      searchEvents({
        data: {
          categories: ['task', 'homework', 'deadline'],
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString(),
          limit: 20,
        },
      }),
      // Fetch upcoming assignments (not completed)
      fetchAssignments({
        data: {
          upcoming: true,
          limit: 10,
        },
      }),
      // Fetch recent notes for AI Study Card
      fetchNotes({
        data: {
          limit: 5,
        },
      }),
      // Fetch all events for calendar dots
      searchEvents({
        data: {
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString(),
          limit: 100,
        },
      }),
    ])

    // Extract unique event dates for mini calendar
    const eventDates = [...new Set(
      (calendarEventsResult.events || []).map(e => e.start_time.split('T')[0])
    )]

    return {
      examEvents: examsResult.events || [],
      classes: classesResult.classes || [],
      todayEvents: todayTasksResult.events || [],
      assignments: assignmentsResult.assignments || [],
      notes: notesResult.notes || [],
      eventDates,
    }
  },
  component: DashboardPage,
})

// =============================================
// Static Mock Data (to be replaced with real data later)
// =============================================

// Transform database Event to dashboard Task interface
function transformEventToTask(event: Event): Task {
  const eventDate = new Date(event.start_time)
  const dueTime = event.all_day
    ? undefined
    : eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  // Map event category to task category
  let category: 'task' | 'homework' | 'exam' = 'task'
  if (event.category === 'homework') category = 'homework'
  else if (event.category === 'deadline') category = 'homework'
  else if (event.category === 'exam') category = 'exam'

  return {
    id: event.id,
    title: event.title,
    completed: event.completed || false,
    category,
    dueTime,
  }
}

// Transform database Event to dashboard Exam interface
function transformEventToExam(event: Event): Exam {
  const examDate = new Date(event.start_time)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return {
    id: event.id,
    subject: event.title,
    date: examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: event.all_day ? undefined : examDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    location: event.description || undefined,
    daysUntil,
  }
}

// Transform database Assignment to dashboard Homework interface
function transformAssignmentToHomework(assignment: Assignment, classes: Class[]): Homework {
  const dueDate = new Date(assignment.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Get class name if linked
  let subject = 'General'
  if (assignment.linked_class_id) {
    const linkedClass = classes.find(c => c.id === assignment.linked_class_id)
    if (linkedClass) {
      subject = linkedClass.module_name || linkedClass.title
    }
  }

  return {
    id: assignment.id,
    title: assignment.title,
    subject,
    dueDate: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    daysUntil,
    completed: assignment.completed || false,
  }
}

// Get classes scheduled for today
function getClassesForToday(classes: Class[]): ClassSchedule[] {
  const now = new Date()
  const todayDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const todayDate = now.toISOString().split('T')[0]

  // Filter classes that occur on today's day of week and are within semester bounds
  const todaysClasses = classes.filter((classItem) => {
    // Check if today is one of the scheduled days
    if (!classItem.days_of_week.includes(todayDayOfWeek)) return false

    // Check if today is within semester bounds
    const semesterStart = classItem.semester_start
    const semesterEnd = classItem.semester_end
    return todayDate >= semesterStart && todayDate <= semesterEnd
  })

  // Transform to ClassSchedule format and sort by start time
  const transformed = todaysClasses.map((classItem) => {
    // Parse times to check ongoing/next status
    const [startHour, startMin] = classItem.start_time.split(':').map(Number)
    const [endHour, endMin] = classItem.end_time.split(':').map(Number)

    const classStart = new Date(now)
    classStart.setHours(startHour, startMin, 0, 0)

    const classEnd = new Date(now)
    classEnd.setHours(endHour, endMin, 0, 0)

    const isOngoing = now >= classStart && now < classEnd
    const isUpcoming = now < classStart

    return {
      id: classItem.id,
      subject: classItem.title,
      startTime: formatClassTime(classItem.start_time),
      endTime: formatClassTime(classItem.end_time),
      location: classItem.location || undefined,
      instructor: classItem.instructor || undefined,
      isOngoing,
      isUpcoming,
      sortTime: startHour * 60 + startMin, // For sorting
    }
  })

  // Sort by start time
  transformed.sort((a, b) => a.sortTime - b.sortTime)

  // Mark the first upcoming class as "next"
  let foundNext = false
  return transformed.map(({ sortTime, isUpcoming, ...rest }) => ({
    ...rest,
    isNext: !foundNext && isUpcoming && !rest.isOngoing ? (foundNext = true, true) : false,
  }))
}



// Transform database Note to dashboard StudyNote interface
function transformNoteToStudyNote(note: Note): StudyNote {
  const noteDate = new Date(note.created_at || Date.now())

  // Extract plain text excerpt from HTML content
  let excerpt = ''
  if (note.content) {
    excerpt = note.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .substring(0, 120)
    if (note.content.length > 120) excerpt += '...'
  }

  return {
    id: note.id,
    title: note.title,
    subject: note.subject || 'General',
    date: noteDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    excerpt,
  }
}

// Placeholder questions - TODO: Replace with AI-generated questions based on notes
const PLACEHOLDER_QUESTIONS: StudyQuestion[] = [
  {
    id: '1',
    question: 'Review your recent notes and identify key concepts.',
    topic: 'Study Review',
    difficulty: 'medium',
  },
  {
    id: '2',
    question: 'What are the main topics from your upcoming exams?',
    topic: 'Exam Prep',
    difficulty: 'easy',
  },
  {
    id: '3',
    question: 'Create flashcards for the most important terms.',
    topic: 'Active Learning',
    difficulty: 'medium',
  },
]

// =============================================
// Dashboard Page Component
// =============================================

function DashboardPage() {
  const { examEvents, classes, todayEvents, assignments, notes, eventDates } = Route.useLoaderData()
  const navigate = useNavigate()

  // Track local completion overrides for optimistic updates
  const [completionOverrides, setCompletionOverrides] = useState<Record<string, boolean>>({})
  const [assignmentOverrides, setAssignmentOverrides] = useState<Record<string, boolean>>({})

  // Transform today's events to tasks, applying any local overrides
  const tasks = useMemo(() => {
    return todayEvents.map(event => {
      const task = transformEventToTask(event)
      // Apply local override if exists
      if (completionOverrides[task.id] !== undefined) {
        return { ...task, completed: completionOverrides[task.id] }
      }
      return task
    })
  }, [todayEvents, completionOverrides])

  // Transform assignments to homework format, applying any local overrides
  const homework = useMemo(() => {
    return assignments.map(assignment => {
      const hw = transformAssignmentToHomework(assignment, classes)
      // Apply local override if exists
      if (assignmentOverrides[hw.id] !== undefined) {
        return { ...hw, completed: assignmentOverrides[hw.id] }
      }
      return hw
    })
  }, [assignments, classes, assignmentOverrides])

  // Transform notes to study notes format
  const studyNotes = useMemo(() => {
    return notes.map(transformNoteToStudyNote)
  }, [notes])

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [studyQuestions, setStudyQuestions] = useState<StudyQuestion[]>(PLACEHOLDER_QUESTIONS)

  // Transform exam events to dashboard format
  const exams = useMemo(() => {
    return examEvents.map(transformEventToExam)
  }, [examEvents])

  // Get today's classes from timetable
  const todaysClasses = useMemo(() => {
    return getClassesForToday(classes)
  }, [classes])

  const handleExamClick = useCallback((examId: string) => {
    navigate({ to: '/exams', search: { id: examId } })
  }, [navigate])

  const handleToggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newCompleted = !task.completed

    // Optimistic update
    setCompletionOverrides(prev => ({ ...prev, [taskId]: newCompleted }))

    // Update in database
    const result = await toggleEventComplete({ data: { id: taskId, completed: newCompleted } })
    if (!result.success) {
      // Revert on error
      setCompletionOverrides(prev => ({ ...prev, [taskId]: !newCompleted }))
    }
  }, [tasks])

  const handleToggleHomework = useCallback(async (homeworkId: string) => {
    const hw = homework.find(h => h.id === homeworkId)
    if (!hw) return

    const newCompleted = !hw.completed
    const newStatus = newCompleted ? 'submitted' : 'not_started'

    // Optimistic update
    setAssignmentOverrides(prev => ({ ...prev, [homeworkId]: newCompleted }))

    // Update in database
    const result = await updateAssignmentStatus({
      data: { id: homeworkId, status: newStatus }
    })

    if (!result.success) {
      // Revert on error
      setAssignmentOverrides(prev => ({ ...prev, [homeworkId]: !newCompleted }))
    }
  }, [homework])

  const handleHomeworkClick = useCallback((homeworkId: string) => {
    navigate({ to: '/assignments/$assignmentId', params: { assignmentId: homeworkId } })
  }, [navigate])

  const handleRefreshQuestions = useCallback(() => {
    // Simulate AI generating new questions (shuffle existing ones)
    setStudyQuestions((prev) => [...prev].sort(() => Math.random() - 0.5))
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Calculate stats
  const completedTasksToday = tasks.filter((t) => t.completed).length
  const totalTasksToday = tasks.length
  const upcomingExamsCount = exams.length
  const pendingHomeworkCount = homework.filter((h) => !h.completed).length

  return (
    <div className="dashboard-v2">
      {/* Left Panel */}
      <div className="dashboard-v2__left">
        {/* My Classes Section */}
        <ClassesToday
          classes={todaysClasses}
          onClassClick={(classId) => navigate({ to: '/timetable' })}
        />

        {/* Today Tasks Section */}
        <TodaysTasks
          tasks={tasks}
          onToggleComplete={handleToggleTask}
        />

        {/* AI Study Card */}
        <AIStudyCard
          recentNotes={studyNotes}
          suggestedQuestions={studyQuestions}
          onRefreshQuestions={handleRefreshQuestions}
        />
      </div>

      {/* Right Panel */}
      <div className="dashboard-v2__right">
        {/* Search Header */}
        <div className="dashboard-v2__header">
          <div className="dashboard-v2__search">
            <SearchIcon />
            <input type="text" placeholder="Search for anythings .." className="dashboard-v2__search-input" />
          </div>
          <div className="dashboard-v2__avatar">
            <img src="https://i.pravatar.cc/40?img=5" alt="Profile" />
          </div>
        </div>

        {/* Calendar Widget */}
        <MiniCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          eventDates={eventDates}
        />

        {/* Upcoming Section - Exams */}
        <ExamsComingUp
          exams={exams}
          onExamClick={handleExamClick}
        />

        {/* Homework Coming Up */}
        <HomeworkComingUp
          homework={homework}
          onHomeworkClick={handleHomeworkClick}
          onToggleComplete={handleToggleHomework}
        />
      </div>
    </div>
  )
}

// Search Icon Component
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
