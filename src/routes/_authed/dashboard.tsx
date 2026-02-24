import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
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

export const Route = createFileRoute('/_authed/dashboard')({
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

const MOCK_EXAMS: Exam[] = [
  { id: '1', subject: 'Anatomy & Physiology', date: 'Mar 3, 2026', time: '9:00 AM', location: 'Room 201', daysUntil: 6 },
  { id: '2', subject: 'Biochemistry', date: 'Mar 8, 2026', time: '2:00 PM', location: 'Hall B', daysUntil: 11 },
  { id: '3', subject: 'Clinical Practice', date: 'Mar 15, 2026', time: '10:00 AM', daysUntil: 18 },
]

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
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const [homework, setHomework] = useState<Homework[]>(MOCK_HOMEWORK)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [studyQuestions, setStudyQuestions] = useState<StudyQuestion[]>(MOCK_QUESTIONS)

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
  const upcomingExamsCount = MOCK_EXAMS.length
  const pendingHomeworkCount = homework.filter((h) => !h.completed).length

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dashboard__header">
        <div className="dashboard__greeting">
          <h1 className="dashboard__title">{getGreeting()}, Anna!</h1>
          <p className="dashboard__subtitle">Here's your study overview for today</p>
        </div>
        <div className="dashboard__date">
          <span className="dashboard__date-day">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </span>
          <span className="dashboard__date-full">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dashboard__stats">
        <div className="dashboard__stat">
          <span className="dashboard__stat-value">{completedTasksToday}/{totalTasksToday}</span>
          <span className="dashboard__stat-label">Tasks Today</span>
        </div>
        <div className="dashboard__stat">
          <span className="dashboard__stat-value">{upcomingExamsCount}</span>
          <span className="dashboard__stat-label">Upcoming Exams</span>
        </div>
        <div className="dashboard__stat">
          <span className="dashboard__stat-value">{pendingHomeworkCount}</span>
          <span className="dashboard__stat-label">Pending Homework</span>
        </div>
        <div className="dashboard__stat">
          <span className="dashboard__stat-value">{MOCK_CLASSES.length}</span>
          <span className="dashboard__stat-label">Classes Today</span>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard__grid">
        {/* Left Column */}
        <div className="dashboard__column dashboard__column--left">
          <TodaysTasks
            tasks={tasks}
            onToggleComplete={handleToggleTask}
          />
          <ClassesToday
            classes={MOCK_CLASSES}
          />
        </div>

        {/* Center Column */}
        <div className="dashboard__column dashboard__column--center">
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            eventDates={MOCK_EVENT_DATES}
          />
          <AIStudyCard
            recentNotes={MOCK_NOTES}
            suggestedQuestions={studyQuestions}
            onRefreshQuestions={handleRefreshQuestions}
          />
        </div>

        {/* Right Column */}
        <div className="dashboard__column dashboard__column--right">
          <ExamsComingUp
            exams={MOCK_EXAMS}
          />
          <HomeworkComingUp
            homework={homework}
            onToggleComplete={handleToggleHomework}
          />
        </div>
      </div>
    </div>
  )
}
