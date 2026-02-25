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
import { searchEvents, type Event } from '~/utils/events'

export const Route = createFileRoute('/_authed/dashboard')({
  loader: async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch exams from today onwards (next 30 days for dashboard)
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 30)

    const result = await searchEvents({
      data: {
        categories: ['exam'],
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
        limit: 5,
      },
    })

    return {
      examEvents: result.events || [],
    }
  },
  component: DashboardPage,
})

// =============================================
// Static Mock Data (to be replaced with real data later)
// =============================================

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Review Chapter 5 notes', completed: false, category: 'task', dueTime: '10:00 AM' },
  { id: '2', title: 'Complete Physiology worksheet', completed: false, category: 'homework', dueTime: '2:00 PM' },
  { id: '3', title: 'Prepare for Anatomy quiz', completed: true, category: 'exam', dueTime: '4:00 PM' },
  { id: '4', title: 'Submit lab report draft', completed: false, category: 'task', dueTime: '6:00 PM' },
  { id: '5', title: 'Watch lecture recording', completed: false, category: 'task' },
]

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

const MOCK_CLASSES: ClassSchedule[] = [
  { id: '1', subject: 'Anatomy Lab', startTime: '8:00 AM', endTime: '10:00 AM', location: 'Lab 102', instructor: 'Dr. Smith' },
  { id: '2', subject: 'Physiology Lecture', startTime: '10:30 AM', endTime: '12:00 PM', location: 'Hall A', instructor: 'Prof. Johnson', isOngoing: true },
  { id: '3', subject: 'Clinical Practice', startTime: '2:00 PM', endTime: '4:00 PM', location: 'Hospital Wing', instructor: 'Dr. Williams', isNext: true },
  { id: '4', subject: 'Study Group', startTime: '5:00 PM', endTime: '6:30 PM', location: 'Library Room 3' },
]

const MOCK_HOMEWORK: Homework[] = [
  { id: '1', title: 'Chapter 7 Questions', subject: 'Anatomy', dueDate: 'Feb 26', daysUntil: 1, completed: false },
  { id: '2', title: 'Lab Report: Muscle Analysis', subject: 'Physiology', dueDate: 'Feb 27', daysUntil: 2, completed: false },
  { id: '3', title: 'Case Study Review', subject: 'Clinical Practice', dueDate: 'Feb 28', daysUntil: 3, completed: true },
  { id: '4', title: 'Research Paper Outline', subject: 'Biochemistry', dueDate: 'Mar 2', daysUntil: 5, completed: false },
]

const MOCK_NOTES: StudyNote[] = [
  {
    id: '1',
    title: 'Muscle Contraction Mechanisms',
    subject: 'Physiology',
    date: 'Feb 24',
    excerpt: 'The sliding filament theory explains how actin and myosin interact during muscle contraction...',
  },
  {
    id: '2',
    title: 'Skeletal System Overview',
    subject: 'Anatomy',
    date: 'Feb 23',
    excerpt: 'The human skeleton consists of 206 bones divided into axial and appendicular regions...',
  },
  {
    id: '3',
    title: 'Patient Assessment Basics',
    subject: 'Clinical Practice',
    date: 'Feb 22',
    excerpt: 'Initial patient assessment includes vital signs, medical history, and chief complaint...',
  },
]

const MOCK_QUESTIONS: StudyQuestion[] = [
  {
    id: '1',
    question: 'What is the role of calcium ions in muscle contraction?',
    topic: 'Muscle Physiology',
    difficulty: 'medium',
  },
  {
    id: '2',
    question: 'Name the four main components of the sliding filament theory.',
    topic: 'Physiology',
    difficulty: 'easy',
  },
  {
    id: '3',
    question: 'How does the axial skeleton differ from the appendicular skeleton in function?',
    topic: 'Anatomy',
    difficulty: 'medium',
  },
  {
    id: '4',
    question: 'Explain the steps of initial patient assessment in emergency situations.',
    topic: 'Clinical Practice',
    difficulty: 'hard',
  },
]

const MOCK_EVENT_DATES = [
  '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28',
  '2026-03-03', '2026-03-05', '2026-03-08', '2026-03-10',
]

// =============================================
// Dashboard Page Component
// =============================================

function DashboardPage() {
  const { examEvents } = Route.useLoaderData()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const [homework, setHomework] = useState<Homework[]>(MOCK_HOMEWORK)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [studyQuestions, setStudyQuestions] = useState<StudyQuestion[]>(MOCK_QUESTIONS)

  // Transform exam events to dashboard format
  const exams = useMemo(() => {
    return examEvents.map(transformEventToExam)
  }, [examEvents])

  const handleExamClick = useCallback((examId: string) => {
    navigate({ to: '/exams', search: { id: examId } })
  }, [navigate])

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }, [])

  const handleToggleHomework = useCallback((homeworkId: string) => {
    setHomework((prev) =>
      prev.map((hw) =>
        hw.id === homeworkId ? { ...hw, completed: !hw.completed } : hw
      )
    )
  }, [])

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
        {/* My Classes Section - UNCHANGED per requirements */}
        <ClassesToday
          classes={MOCK_CLASSES}
        />

        {/* Today Tasks Section */}
        <TodaysTasks
          tasks={tasks}
          onToggleComplete={handleToggleTask}
        />

        {/* AI Study Card */}
        <AIStudyCard
          recentNotes={MOCK_NOTES}
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
          eventDates={MOCK_EVENT_DATES}
        />

        {/* Upcoming Section - Exams */}
        <ExamsComingUp
          exams={exams}
          onExamClick={handleExamClick}
        />

        {/* Homework Coming Up */}
        <HomeworkComingUp
          homework={homework}
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
