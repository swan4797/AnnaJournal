import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { TopHeader } from '~/components/layout'
import { Calendar, type CalendarView } from '~/components/calendar'
import { CreateEventModal, EditEventModal, QuickCapture, EventBlock, SearchBar } from '~/components/events'
import { FileListCompact } from '~/components/events/FileList'
import { RichTextViewer } from '~/components/ui'
import { fetchEvents, deleteEvent, toggleEventComplete, type Event } from '~/utils/events'
import { fetchEventFiles, type FileRecord } from '~/utils/files'
import { getMonthRange, formatDateKey, formatTime } from '~/utils/calendar'
import { getCategoryConfig, CATEGORY_LIST, type EventCategory } from '~/utils/categories'

export const Route = createFileRoute('/_authed/calendar')({
  loader: async () => {
    const today = new Date()
    const { start, end } = getMonthRange(today.getFullYear(), today.getMonth())
    const result = await fetchEvents({ data: { start, end } })
    return {
      events: result.events,
      initialYear: today.getFullYear(),
      initialMonth: today.getMonth(),
    }
  },
  component: CalendarPage,
})

function CalendarPage() {
  const { events: initialEvents } = Route.useLoaderData()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [currentView, setCurrentView] = useState<CalendarView>('week')

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([])

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [createEventDate, setCreateEventDate] = useState<Date>(new Date())

  // Filter events by selected categories
  const filteredEvents = useMemo(() => {
    if (selectedCategories.length === 0) return events
    return events.filter(e => selectedCategories.includes(e.category as EventCategory))
  }, [events, selectedCategories])

  const handleDateRangeChange = useCallback(async (start: string, end: string) => {
    const result = await fetchEvents({ data: { start, end } })
    if (!result.error) {
      setEvents(result.events)
    }
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
  }, [])

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event)
    setSelectedDate(new Date(event.start_time))
  }, [])

  const handleCreateEvent = useCallback((date: Date, hour?: number) => {
    const eventDate = new Date(date)
    if (hour !== undefined) {
      eventDate.setHours(hour, 0, 0, 0)
    }
    setCreateEventDate(eventDate)
    setIsCreateModalOpen(true)
  }, [])

  const handleEventCreated = useCallback((event: Event) => {
    setEvents((prev) => [...prev, event])
    setSelectedEvent(event)
  }, [])

  const handleEventUpdated = useCallback((updatedEvent: Event) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    )
    setSelectedEvent(updatedEvent)
  }, [])

  const handleDeleteEvent = useCallback(async (event: Event) => {
    const result = await deleteEvent({ data: { id: event.id } })
    if (result.success) {
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
      setSelectedEvent(null)
    }
  }, [])

  const handleToggleComplete = useCallback(async (event: Event) => {
    const result = await toggleEventComplete({
      data: { id: event.id, completed: !event.completed },
    })
    if (result.success) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, completed: !e.completed } : e
        )
      )
      if (selectedEvent?.id === event.id) {
        setSelectedEvent({ ...event, completed: !event.completed })
      }
    }
  }, [selectedEvent])

  // Handle search result selection
  const handleSearchEventSelect = useCallback((event: Event) => {
    setSelectedEvent(event)
    setSelectedDate(new Date(event.start_time))
  }, [])

  // Get date range for header
  const getDateRangeDisplay = () => {
    const now = selectedDate || new Date()
    const month = now.toLocaleDateString('en-US', { month: 'long' })
    const day = now.getDate().toString().padStart(2, '0')
    const year = now.getFullYear()
    return { month, day, year, full: `${month} ${day} - ${year}` }
  }

  const handleCategoryPillClick = (category: EventCategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const handleAllClick = () => {
    setSelectedCategories([])
  }

  const dateDisplay = getDateRangeDisplay()

  // Calculate stats
  const todayKey = formatDateKey(new Date())
  const todayEvents = filteredEvents.filter(e => formatDateKey(new Date(e.start_time)) === todayKey)
  const completedTasks = filteredEvents.filter(e => e.completed).length

  // Calculate total study hours today
  const totalStudyHours = todayEvents.reduce((acc, event) => {
    if (event.end_time) {
      const start = new Date(event.start_time)
      const end = new Date(event.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return acc + hours
    }
    return acc + 1 // Default 1 hour for events without end time
  }, 0)

  return (
    <div className="physio-schedule">
      {/* Top Row - Stats and Controls */}
      <div className="physio-schedule__top-row">
        {/* Page Header */}
        <div className="physio-schedule__page-header">
          <h1 className="physio-schedule__page-title">My Calendar</h1>
          <p className="physio-schedule__page-subtitle">information designed to accurate insights</p>
        </div>

        {/* Stats Cards */}
        <div className="physio-schedule__stats-cards">
          <div className="physio-schedule__stat-card">
            <span className="physio-schedule__stat-label">Total study hours today</span>
            <div className="physio-schedule__stat-value">
              <span className="physio-schedule__stat-number">{Math.round(totalStudyHours) || 0}</span>
              <span className="physio-schedule__stat-unit">hours</span>
            </div>
          </div>
          <div className="physio-schedule__stat-card">
            <span className="physio-schedule__stat-label">Tasks completed</span>
            <div className="physio-schedule__stat-value">
              <span className="physio-schedule__stat-number">{completedTasks || 0}</span>
              <span className="physio-schedule__stat-unit">tasks</span>
            </div>
          </div>
          <button
            className="physio-schedule__add-task-btn-main"
            onClick={() => handleCreateEvent(selectedDate || new Date())}
          >
            <PlusIcon />
            <span>Add Task</span>
          </button>
        </div>

        {/* Top Bar Controls */}
        <div className="physio-schedule__topbar">
          <div className="physio-schedule__view-toggle">
            <button
              className={`physio-schedule__view-btn ${currentView === 'day' ? 'physio-schedule__view-btn--active' : ''}`}
              onClick={() => setCurrentView('day')}
            >
              Daily
            </button>
            <button
              className={`physio-schedule__view-btn ${currentView === 'week' ? 'physio-schedule__view-btn--active' : ''}`}
              onClick={() => setCurrentView('week')}
            >
              Weekly
            </button>
            <button
              className={`physio-schedule__view-btn ${currentView === 'month' ? 'physio-schedule__view-btn--active' : ''}`}
              onClick={() => setCurrentView('month')}
            >
              Monthly
            </button>
          </div>

          <div className="physio-schedule__topbar-right">
            <button className="physio-schedule__icon-btn">
              <BellIcon />
            </button>
            <div className="physio-schedule__topbar-avatar">
              <img src="https://i.pravatar.cc/40?img=3" alt="Profile" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendars Row - Mini Calendar + Main Calendar */}
      <div className="physio-schedule__calendars-row">
        {/* Left - Mini Calendar and Task List */}
        <aside className="physio-schedule__sidebar">
          {/* Mini Calendar Widget */}
          <div className="physio-schedule__mini-calendar-card">
            <MiniCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              events={filteredEvents}
            />
          </div>

          {/* My Calendar - Task List */}
          <div className="physio-schedule__task-card">
            <div className="physio-schedule__task-header">
              <h3 className="physio-schedule__task-title">My Calendar</h3>
              <div className="physio-schedule__task-actions">
                <span className="physio-schedule__task-label">Checklist</span>
                <button className="physio-schedule__task-check-btn">
                  <CheckCircleIcon />
                </button>
              </div>
            </div>
            <MyCalendarChecklist
              events={filteredEvents}
              onEventClick={handleEventClick}
              onToggleComplete={handleToggleComplete}
            />
          </div>
        </aside>

        {/* Right - Main Calendar */}
        <main className="physio-schedule__main">
          {/* Week Navigator */}
          <div className="physio-schedule__week-nav">
            <h2 className="physio-schedule__date-title">{dateDisplay.full}</h2>
            <div className="physio-schedule__week-nav-actions">
              <button
                className="physio-schedule__today-btn"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </button>
              <div className="physio-schedule__nav-arrows">
                <button className="physio-schedule__arrow-btn">
                  <ChevronLeftIcon />
                </button>
                <button className="physio-schedule__arrow-btn">
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="physio-schedule__calendar-container">
            <Calendar
              events={filteredEvents}
              selectedDate={selectedDate}
              currentView={currentView}
              onViewChange={setCurrentView}
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
              onDateRangeChange={handleDateRangeChange}
              onCreateEvent={handleCreateEvent}
            />
          </div>
        </main>
      </div>

      {/* Event Details Panel (appears when event selected) */}
      {selectedEvent && (
        <aside className="physio-schedule__details-panel">
          <EventDetails
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onEdit={() => setIsEditModalOpen(true)}
            onDelete={() => handleDeleteEvent(selectedEvent)}
            onToggleComplete={() => handleToggleComplete(selectedEvent)}
          />
        </aside>
      )}

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialDate={createEventDate}
        onEventCreated={handleEventCreated}
      />

      {selectedEvent && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          event={selectedEvent}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  )
}

// =====================
// Icon Components
// =====================

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="6" fill="currentColor" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function CalendarGridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="7" y="14" width="3" height="3" rx="0.5" />
      <rect x="14" y="14" width="3" height="3" rx="0.5" />
    </svg>
  )
}

function ViewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9,12 11,14 15,10" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15,18 9,12 15,6" />
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

// =====================
// Mini Calendar Component
// =====================

interface MiniCalendarProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  events: Event[]
}

function MiniCalendar({ selectedDate, onDateSelect, events }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate || new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  // Adjust to start week on Monday
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isToday = (day: number) => {
    return today.getFullYear() === currentMonth.getFullYear() &&
           today.getMonth() === currentMonth.getMonth() &&
           today.getDate() === day
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return selectedDate.getFullYear() === currentMonth.getFullYear() &&
           selectedDate.getMonth() === currentMonth.getMonth() &&
           selectedDate.getDate() === day
  }

  const hasEvents = (day: number) => {
    const dateKey = formatDateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
    return events.some(e => formatDateKey(new Date(e.start_time)) === dateKey)
  }

  const handleDayClick = (day: number) => {
    onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
  }

  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="mini-cal__day mini-cal__day--empty" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const classes = [
      'mini-cal__day',
      isToday(day) && 'mini-cal__day--today',
      isSelected(day) && 'mini-cal__day--selected',
      hasEvents(day) && 'mini-cal__day--has-events',
    ].filter(Boolean).join(' ')

    days.push(
      <button key={day} className={classes} onClick={() => handleDayClick(day)}>
        {day}
      </button>
    )
  }

  return (
    <div className="mini-cal">
      <div className="mini-cal__header">
        <h3 className="mini-cal__month">{monthName}</h3>
        <div className="mini-cal__nav">
          <button onClick={prevMonth} className="mini-cal__nav-btn">
            <ChevronLeftIcon />
          </button>
          <button onClick={nextMonth} className="mini-cal__nav-btn">
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      <div className="mini-cal__weekdays">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="mini-cal__weekday">{day}</div>
        ))}
      </div>
      <div className="mini-cal__grid">
        {days}
      </div>
    </div>
  )
}

// =====================
// My Calendar Checklist
// =====================

interface MyCalendarChecklistProps {
  events: Event[]
  onEventClick: (event: Event) => void
  onToggleComplete: (event: Event) => void
}

function MyCalendarChecklist({ events, onEventClick, onToggleComplete }: MyCalendarChecklistProps) {
  // Get tasks/homework events for checklist
  const checklistEvents = events
    .filter(e => e.category === 'task' || e.category === 'homework')
    .slice(0, 4)

  if (checklistEvents.length === 0) {
    return (
      <div className="physio-schedule__checklist">
        <div className="physio-schedule__checklist-empty">No tasks available</div>
      </div>
    )
  }

  return (
    <div className="physio-schedule__checklist">
      {checklistEvents.map((event) => (
        <div key={event.id} className="physio-schedule__checklist-item">
          <button
            className={`physio-schedule__checkbox ${event.completed ? 'physio-schedule__checkbox--checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete(event)
            }}
          >
            {event.completed && <CheckIcon />}
          </button>
          <span
            className={`physio-schedule__checklist-text ${event.completed ? 'physio-schedule__checklist-text--completed' : ''}`}
            onClick={() => onEventClick(event)}
          >
            {event.title}
          </span>
        </div>
      ))}
    </div>
  )
}

// =====================
// Other Calendar List
// =====================

interface OtherCalendarListProps {
  events: Event[]
}

function OtherCalendarList({ events }: OtherCalendarListProps) {
  // Get lecture/meeting events for other calendar
  const otherEvents = events
    .filter(e => e.category === 'lecture' || e.category === 'meeting' || e.category === 'clinical')
    .slice(0, 3)

  if (otherEvents.length === 0) {
    return (
      <div className="physio-schedule__other-list">
        <div className="physio-schedule__other-empty">No upcoming events</div>
      </div>
    )
  }

  return (
    <div className="physio-schedule__other-list">
      {otherEvents.map((event) => (
        <div key={event.id} className="physio-schedule__other-item">
          <span className="physio-schedule__other-check">
            <CheckIcon />
          </span>
          <span className="physio-schedule__other-text">{event.title}</span>
        </div>
      ))}
    </div>
  )
}

// =====================
// Event Details Panel
// =====================

interface EventDetailsProps {
  event: Event
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleComplete: () => void
}

function EventDetails({ event, onClose, onEdit, onDelete, onToggleComplete }: EventDetailsProps) {
  const category = getCategoryConfig(event.category)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  // Fetch files when event changes
  useEffect(() => {
    setLoadingFiles(true)
    fetchEventFiles({ data: { eventId: event.id } })
      .then(result => {
        if (result.files) {
          setFiles(result.files)
        }
      })
      .finally(() => setLoadingFiles(false))
  }, [event.id])

  return (
    <div className="event-panel">
      {/* Header */}
      <div className="event-panel__header">
        <h3 className="event-panel__title">Event Details</h3>
        <button onClick={onClose} className="event-panel__close">
          <CloseIcon />
        </button>
      </div>

      {/* Event card */}
      <div className={`event-panel__card event-panel__card--${event.category}`}>
        <div className="event-panel__category">
          <span className="event-panel__category-icon">{category.icon}</span>
          <span className="event-panel__category-label">{category.label}</span>
          {event.priority === 'high' && (
            <span className="event-panel__badge">High</span>
          )}
        </div>
        <h4 className={`event-panel__event-title ${event.completed ? 'event-panel__event-title--completed' : ''}`}>
          {event.title}
        </h4>
      </div>

      {/* Details */}
      <div className="event-panel__content">
        {/* Time */}
        <div className="event-panel__section">
          <h5 className="event-panel__section-title">Time</h5>
          <p className="event-panel__section-content">
            {event.all_day ? (
              'All day'
            ) : (
              <>
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </>
            )}
          </p>
        </div>

        {/* Description */}
        {event.description && (
          <div className="event-panel__section">
            <h5 className="event-panel__section-title">Description</h5>
            <p className="event-panel__section-content">{event.description}</p>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="event-panel__section">
            <h5 className="event-panel__section-title">Notes</h5>
            <RichTextViewer content={event.notes} className="event-panel__section-content" />
          </div>
        )}

        {/* Attachments */}
        {(loadingFiles || files.length > 0) && (
          <div className="event-panel__section">
            <h5 className="event-panel__section-title">Attachments</h5>
            {loadingFiles ? (
              <p>Loading...</p>
            ) : (
              <FileListCompact files={files} />
            )}
          </div>
        )}

        {/* Completion toggle for tasks/homework */}
        {(event.category === 'task' || event.category === 'homework') && (
          <button
            onClick={onToggleComplete}
            className={`event-panel__complete-btn ${event.completed ? 'event-panel__complete-btn--completed' : ''}`}
          >
            <CheckIcon />
            {event.completed ? 'Completed' : 'Mark as Complete'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="event-panel__actions">
        <button onClick={onEdit} className="event-panel__action-btn event-panel__action-btn--secondary">
          Edit Event
        </button>

        {confirmDelete ? (
          <div className="event-panel__confirm-delete">
            <button onClick={() => setConfirmDelete(false)} className="event-panel__action-btn event-panel__action-btn--ghost">
              Cancel
            </button>
            <button onClick={onDelete} className="event-panel__action-btn event-panel__action-btn--danger">
              Confirm Delete
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="event-panel__action-btn event-panel__action-btn--ghost">
            Delete Event
          </button>
        )}
      </div>
    </div>
  )
}
