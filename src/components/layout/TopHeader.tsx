import { Link, useLocation } from '@tanstack/react-router'

interface TopHeaderProps {
  breadcrumbs: { label: string; href?: string }[]
  title?: string
}

// Navigation tabs for the header
const navTabs = [
  { label: 'Home', href: '/dashboard', icon: <HomeIcon /> },
  { label: 'Calendar', href: '/calendar', icon: <CalendarTabIcon /> },
  { label: 'Classes', href: '/classes', icon: <ClassesTabIcon /> },
  { label: 'Notes', href: '/notes', icon: <NotesTabIcon /> },
]

export function TopHeader({ breadcrumbs }: TopHeaderProps) {
  const location = useLocation()
  const currentPath = location.pathname

  const isTabActive = (href: string) => {
    if (href === '/dashboard' && currentPath === '/dashboard') return true
    if (href !== '/dashboard' && currentPath.startsWith(href)) return true
    return false
  }

  return (
    <header className="top-header">
      {/* Left Section - Menu and Document Icons */}
      <div className="top-header__left">
        <button className="top-header__menu-btn" aria-label="Menu">
          <MenuIcon />
        </button>
        <button className="top-header__icon-btn" aria-label="Documents">
          <DocumentIcon />
        </button>
      </div>

      {/* Center Section - Navigation Tabs */}
      <nav className="top-header__nav">
        {navTabs.map((tab, index) => (
          <Link
            key={index}
            to={tab.href}
            className={`top-header__tab ${isTabActive(tab.href) ? 'top-header__tab--active' : ''}`}
          >
            <span className="top-header__tab-icon">{tab.icon}</span>
            <span className="top-header__tab-label">{tab.label}</span>
          </Link>
        ))}
      </nav>

      {/* Right Section - Action Icons and Avatar */}
      <div className="top-header__actions">
        <button className="top-header__action-btn" aria-label="Messages">
          <MessageIcon />
        </button>
        <button className="top-header__action-btn" aria-label="Notifications">
          <NotificationIcon />
        </button>
        <button className="top-header__action-btn" aria-label="Search">
          <SearchIcon />
        </button>
        <div className="top-header__avatar">
          <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" alt="User" />
        </div>
      </div>

      {/* Hidden breadcrumb for accessibility/SEO - keeps original functionality */}
      <nav className="top-header__breadcrumb sr-only">
        {breadcrumbs.map((item, index) => (
          <span key={index}>
            {index > 0 && <span className="top-header__separator">{'>'}</span>}
            {item.href ? (
              <Link to={item.href}>{item.label}</Link>
            ) : (
              <span className="top-header__current">
                <span>{item.label}</span>
              </span>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}

// Icon Components
function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h6" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function CalendarTabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClassesTabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

function NotesTabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function NotificationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
