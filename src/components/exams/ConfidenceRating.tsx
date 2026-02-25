import { useState } from 'react'

interface ConfidenceRatingProps {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'md'
  disabled?: boolean
}

export function ConfidenceRating({
  value,
  onChange,
  size = 'md',
  disabled = false,
}: ConfidenceRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue !== null ? hoverValue : value

  const getStarColor = (starIndex: number) => {
    if (starIndex > displayValue) return 'confidence-rating__star--empty'
    if (displayValue <= 2) return 'confidence-rating__star--low'
    if (displayValue <= 3) return 'confidence-rating__star--medium'
    return 'confidence-rating__star--high'
  }

  const handleClick = (starIndex: number) => {
    if (disabled) return
    // Clicking same value clears it
    if (starIndex === value) {
      onChange(0)
    } else {
      onChange(starIndex)
    }
  }

  return (
    <div
      className={`confidence-rating confidence-rating--${size}`}
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`confidence-rating__star ${getStarColor(star)} ${
            hoverValue !== null && star <= hoverValue ? 'confidence-rating__star--hover' : ''
          }`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          disabled={disabled}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <StarIcon filled={star <= displayValue} />
        </button>
      ))}
    </div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
