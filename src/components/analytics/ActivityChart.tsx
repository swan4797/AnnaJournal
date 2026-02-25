import type { DailyStudyData } from '~/utils/analytics'
import { formatTime } from '~/utils/analytics'

interface ActivityChartProps {
  data: DailyStudyData[]
  days?: number
}

export function ActivityChart({ data, days = 14 }: ActivityChartProps) {
  // Generate last N days
  const today = new Date()
  const dateRange: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dateRange.push(date.toISOString().split('T')[0])
  }

  // Map data to dates
  const dataMap = new Map(data.map((d) => [d.date, d]))

  // Find max for scaling
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 60)

  return (
    <div className="activity-chart">
      <div className="activity-chart__header">
        <h4 className="activity-chart__title">Study Activity</h4>
        <span className="activity-chart__subtitle">Last {days} days</span>
      </div>

      <div className="activity-chart__bars">
        {dateRange.map((date) => {
          const dayData = dataMap.get(date)
          const minutes = dayData?.minutes || 0
          const height = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0
          const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
          const isToday = date === today.toISOString().split('T')[0]

          return (
            <div key={date} className="activity-chart__bar-container">
              <div className="activity-chart__bar-wrapper">
                <div
                  className={`activity-chart__bar ${minutes > 0 ? 'activity-chart__bar--filled' : ''} ${isToday ? 'activity-chart__bar--today' : ''}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${date}: ${formatTime(minutes)}`}
                />
              </div>
              <span className={`activity-chart__label ${isToday ? 'activity-chart__label--today' : ''}`}>
                {dayOfWeek.charAt(0)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="activity-chart__legend">
        <span className="activity-chart__legend-item">
          <span className="activity-chart__legend-dot" />
          Study session
        </span>
      </div>
    </div>
  )
}
