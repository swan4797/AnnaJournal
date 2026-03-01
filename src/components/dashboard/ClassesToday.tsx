import { ClockIcon, MapPinIcon } from './icons'

export interface ClassSchedule {
  id: string
  subject: string
  startTime: string
  endTime: string
  location?: string
  instructor?: string
  isOngoing?: boolean
  isNext?: boolean
}

interface ClassesTodayProps {
  classes: ClassSchedule[]
  onClassClick?: (classId: string) => void
}

export function ClassesToday({ classes, onClassClick }: ClassesTodayProps) {
  return (
    <div className="dashboard-card dashboard-card--classes">
      <div className="dashboard-card__header">
        <h3 className="dashboard-card__title">
          <ClockIcon />
          Classes Today
        </h3>
        <div className="dashboard-card__actions">
          <span className="dashboard-card__count">{classes.length}</span>
          <button type="button" className="dashboard-card__action-btn">
            <MoreIcon />
          </button>
        </div>
      </div>
      <div className="dashboard-card__content">
        {classes.length === 0 ? (
          <div className="dashboard-card__empty">
            <ClockIcon />
            <span>No classes scheduled for today</span>
          </div>
        ) : (
          <div className="classes-timeline">
            {classes.map((classItem, index) => (
              <button
                key={classItem.id}
                type="button"
                className={`classes-timeline__item ${classItem.isOngoing ? 'classes-timeline__item--ongoing' : ''} ${classItem.isNext ? 'classes-timeline__item--next' : ''}`}
                onClick={() => onClassClick?.(classItem.id)}
              >
                <div className="classes-timeline__time-block">
                  <span className="classes-timeline__start">{classItem.startTime}</span>
                  <span className="classes-timeline__end">{classItem.endTime}</span>
                </div>
                <div className="classes-timeline__line">
                  <div className="classes-timeline__dot" />
                  {index < classes.length - 1 && <div className="classes-timeline__connector" />}
                </div>
                <div className="classes-timeline__content">
                  <span className="classes-timeline__subject">{classItem.subject}</span>
                  {classItem.location && (
                    <span className="classes-timeline__location">
                      <MapPinIcon />
                      {classItem.location}
                    </span>
                  )}
                  {classItem.instructor && (
                    <span className="classes-timeline__instructor">{classItem.instructor}</span>
                  )}
                  {classItem.isOngoing && (
                    <span className="classes-timeline__badge classes-timeline__badge--ongoing">Now</span>
                  )}
                  {classItem.isNext && (
                    <span className="classes-timeline__badge classes-timeline__badge--next">Up Next</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  )
}
