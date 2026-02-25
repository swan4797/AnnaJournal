import { useState, useEffect } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useIsMobile } from '~/hooks/useIsMobile'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
  tags?: string[]
}

const mainMenuItems: NavItem[] = [
  {
    icon: <OverviewIcon />,
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    icon: <ScheduleIcon />,
    label: 'Calendar',
    href: '/calendar',
  },
  {
    icon: <TimetableIcon />,
    label: 'Timetable',
    href: '/timetable',
  },
  {
    icon: <ExamsIcon />,
    label: 'Exams',
    href: '/exams',
  },
  {
    icon: <NotesIcon />,
    label: 'Notes',
    href: '/notes',
  },
  {
    icon: <TimerIcon />,
    label: 'Focus Timer',
    href: '/timer',
  },
  {
    icon: <AnalyticsIcon />,
    label: 'Analytics',
    href: '/analytics',
  },
]

interface SidebarProps {
  user?: { email: string } | null
}

export function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const location = useLocation()
  const currentPath = location.pathname

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [location.pathname, isMobile])

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobile, isOpen])

  const toggleSidebar = () => setIsOpen(!isOpen)

  const isActive = (href: string, label: string) => {
    // Check if current path matches the href
    if (currentPath === href) return true
    // Calendar is active when on calendar
    if (label === 'Calendar' && currentPath.includes('/calendar')) return true
    // Dashboard is active when on dashboard
    if (label === 'Dashboard' && currentPath.includes('/dashboard')) return true
    // Exams is active when on exams
    if (label === 'Exams' && currentPath.includes('/exams')) return true
    // Notes is active when on notes
    if (label === 'Notes' && currentPath.includes('/notes')) return true
    // Analytics is active when on analytics
    if (label === 'Analytics' && currentPath.includes('/analytics')) return true
    // Timer is active when on timer
    if (label === 'Focus Timer' && currentPath.includes('/timer')) return true
    // Timetable is active when on timetable
    if (label === 'Timetable' && currentPath.includes('/timetable')) return true
    return false
  }

  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          className={`sidebar-toggle-mobile ${isOpen ? 'sidebar-toggle-mobile--open' : ''}`}
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="sidebar-toggle-mobile__icon" />
        </button>
      )}

      {/* Mobile backdrop */}
      {isMobile && (
        <div
          className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop--visible' : ''}`}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isMobile && isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <LogoIcon />
          </div>
          <button className="sidebar__toggle" onClick={toggleSidebar}>
            <ToggleIcon />
          </button>
        </div>

        <div className="sidebar__content">
          <nav className="sidebar__section">
            <span className="sidebar__section-title">Main menu</span>
            <div className="sidebar__nav">
              {mainMenuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={`sidebar__item ${isActive(item.href, item.label) ? 'sidebar__item--active' : ''}`}
                >
                  <span className="sidebar__icon">{item.icon}</span>
                  <span className="sidebar__label">{item.label}</span>
                  {item.tags && (
                    <div className="sidebar__tags">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="sidebar__tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  {item.badge && <span className="sidebar__badge">{item.badge}</span>}
                </Link>
              ))}
            </div>
          </nav>

        </div>

        <div className="sidebar__footer">
          <span className="sidebar__section-title">Account</span>
          <div className="sidebar__account">
            <div className="sidebar__avatar">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">
                {user?.email?.split('@')[0] || 'Amirbaqian'}
              </span>
              <span className="sidebar__user-role">Student</span>
            </div>
          </div>
          <Link to="/logout" className="sidebar__signout">
            <SignOutIcon />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  )
}

// Icon Components
function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M8 8h6v6H8V8z" fill="currentColor" />
      <path d="M18 8h6v6h-6V8z" fill="currentColor" />
      <path d="M8 18h6v6H8v-6z" fill="currentColor" />
      <circle cx="21" cy="21" r="3" fill="currentColor" />
    </svg>
  )
}

function ToggleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}

function OverviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function ClassPrepIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
    </svg>
  )
}

function AttendanceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

function ExamsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}

function AssignmentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function ScheduleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function StudentsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function MessagesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function TimerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3L2 6" />
      <path d="M22 6l-3-3" />
      <path d="M12 2v2" />
    </svg>
  )
}

function TimetableIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="4" x2="9" y2="22" />
      <line x1="15" y1="4" x2="15" y2="22" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </svg>
  )
}

function ReportsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}

function NewsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <line x1="22" y1="6" x2="12" y2="13" />
      <line x1="2" y1="6" x2="12" y2="13" />
    </svg>
  )
}

function ActivitiesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function WhatsNewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
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

function SignOutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
