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
        <span className="dashboard-card__count">{classes.length} classes</span>
      </div>
      <div className="dashboard-card__content">
        {classes.length === 0 ? (
          <div className="dashboard-card__empty">
            <ClockIcon />
            <span>No classes today</span>
          </div>
        ) : (
          <div className="classes-timeline">
            {classes.map((classItem, index) => (
              <div
                key={classItem.id}
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
                    <span className="classes-timeline__badge classes-timeline__badge--next">Next</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
