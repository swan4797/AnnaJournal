interface StatsCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  subtext?: string
  variant?: 'default' | 'primary' | 'success' | 'warning'
}

export function StatsCard({ label, value, icon, subtext, variant = 'default' }: StatsCardProps) {
  return (
    <div className={`stats-card stats-card--${variant}`}>
      <div className="stats-card__icon">{icon}</div>
      <div className="stats-card__content">
        <span className="stats-card__value">{value}</span>
        <span className="stats-card__label">{label}</span>
        {subtext && <span className="stats-card__subtext">{subtext}</span>}
      </div>
    </div>
  )
}
