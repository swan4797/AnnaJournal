export function Auth({
  actionText,
  onSubmit,
  status,
  afterSubmit,
}: {
  actionText: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  status: 'pending' | 'idle' | 'success' | 'error'
  afterSubmit?: React.ReactNode
}) {
  return (
    <div className="auth-page">
      {/* Left Panel - Illustration */}
      <div className="auth-page__illustration">
        <div className="auth-page__illustration-content">
          <div className="auth-page__clock">
            <ClockIcon />
          </div>
          <div className="auth-page__scene">
            <StudentIllustration />
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-page__form-panel">
        <div className="auth-page__form-container">
          {/* Logo */}
          <div className="auth-page__logo">
            <div className="auth-page__logo-icon">
              <CalendarIcon />
            </div>
            <span className="auth-page__logo-text">Anna Journal</span>
          </div>

          {/* Title */}
          <h1 className="auth-page__title">{actionText === 'Sign In' ? 'Welcome back' : 'Create account'}</h1>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit(e)
            }}
            className="auth-form"
          >
            <div className="auth-form__field">
              <input
                type="email"
                name="email"
                id="email"
                className="auth-form__input"
                placeholder="Email address"
              />
            </div>
            <div className="auth-form__field">
              <input
                type="password"
                name="password"
                id="password"
                className="auth-form__input"
                placeholder="Password"
              />
              <button type="button" className="auth-form__password-toggle" tabIndex={-1}>
                <EyeIcon />
              </button>
            </div>
            <button
              type="submit"
              className="auth-form__submit"
              disabled={status === 'pending'}
            >
              {status === 'pending' ? <span className="auth-form__spinner" /> : actionText}
            </button>
            {afterSubmit ? <div className="auth-form__after">{afterSubmit}</div> : null}
          </form>

          {/* Footer */}
          <div className="auth-page__footer">
            <span>Don't have an account?</span>
            <a href="/signup" className="auth-page__footer-link">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icon Components
function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function StudentIllustration() {
  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="auth-page__student-svg">
      {/* Desk */}
      <rect x="100" y="180" width="200" height="12" rx="2" fill="#2D5A4A" />
      <rect x="120" y="192" width="8" height="60" fill="#E8E8E8" />
      <rect x="272" y="192" width="8" height="60" fill="#E8E8E8" />

      {/* Laptop */}
      <rect x="150" y="140" width="100" height="40" rx="4" fill="#C0C0C0" />
      <rect x="155" y="145" width="90" height="30" rx="2" fill="#333" />
      <rect x="140" y="180" width="120" height="6" rx="1" fill="#A0A0A0" />

      {/* Person - simplified */}
      <circle cx="200" cy="100" r="25" fill="#F5D6C6" />
      <rect x="175" y="125" width="50" height="55" rx="8" fill="#4CAF50" />
      <rect x="170" y="130" width="20" height="40" rx="4" fill="#4CAF50" />
      <rect x="210" y="130" width="20" height="40" rx="4" fill="#4CAF50" />

      {/* Hair */}
      <path d="M175 90 Q200 70 225 90 Q230 100 225 100 L175 100 Q170 100 175 90" fill="#5D4037" />

      {/* Glasses */}
      <circle cx="190" cy="98" r="8" stroke="#333" strokeWidth="2" fill="none" />
      <circle cx="210" cy="98" r="8" stroke="#333" strokeWidth="2" fill="none" />
      <line x1="198" y1="98" x2="202" y2="98" stroke="#333" strokeWidth="2" />

      {/* Coffee cup */}
      <rect x="260" y="165" width="20" height="15" rx="2" fill="#4A90A4" />
      <path d="M280 168 Q290 172 280 178" stroke="#4A90A4" strokeWidth="3" fill="none" />

      {/* Plant */}
      <rect x="320" y="220" width="30" height="35" rx="4" fill="#E0E0E0" />
      <path d="M335 220 Q335 180 320 170" stroke="#4CAF50" strokeWidth="4" fill="none" />
      <path d="M335 220 Q335 190 350 175" stroke="#4CAF50" strokeWidth="4" fill="none" />
      <path d="M335 210 Q340 195 330 185" stroke="#66BB6A" strokeWidth="3" fill="none" />

      {/* Cabinet on left */}
      <rect x="30" y="160" width="50" height="95" rx="4" fill="#F5F5F5" />
      <rect x="35" y="165" width="40" height="25" rx="2" fill="#E0E0E0" />
      <rect x="35" y="195" width="40" height="25" rx="2" fill="#E0E0E0" />
      <rect x="35" y="225" width="40" height="25" rx="2" fill="#E0E0E0" />

      {/* Small cactus on cabinet */}
      <rect x="50" y="145" width="15" height="15" rx="2" fill="#E0E0E0" />
      <ellipse cx="57" cy="140" rx="5" ry="10" fill="#66BB6A" />
    </svg>
  )
}
