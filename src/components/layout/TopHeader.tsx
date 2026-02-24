import { Link } from '@tanstack/react-router'

interface TopHeaderProps {
  breadcrumbs: { label: string; href?: string }[]
  title?: string
}

export function TopHeader({ breadcrumbs }: TopHeaderProps) {
  return (
    <header className="top-header">
      <nav className="top-header__breadcrumb">
        {breadcrumbs.map((item, index) => (
          <span key={index}>
            {index > 0 && <span className="top-header__separator">{'>'}</span>}
            {item.href ? (
              <Link to={item.href}>{item.label}</Link>
            ) : (
              <span className="top-header__current">
                <ScheduleIcon />
                <span>{item.label}</span>
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="top-header__actions">
        <button className="top-header__action-btn">
          <NotificationIcon />
        </button>
        <button className="top-header__action-btn">
          <MessageIcon />
        </button>
        <button className="top-header__action-btn">
          <SearchIcon />
        </button>
      </div>
    </header>
  )
}

function ScheduleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
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
