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
      <div className="auth-page__container">
        <div className="auth-page__logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h1 className="auth-page__title">Anna Journal</h1>
        <p className="auth-page__subtitle">Your personal event & journal companion</p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(e)
          }}
          className="auth-form"
        >
          <div className="input__wrapper">
            <label htmlFor="email" className="input__label">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div className="input__wrapper">
            <label htmlFor="password" className="input__label">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              className="input"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={status === 'pending'}
          >
            {status === 'pending' ? <span className="spinner spinner--sm" /> : actionText}
          </button>
          {afterSubmit ? <div className="auth-form__footer">{afterSubmit}</div> : null}
        </form>
      </div>
    </div>
  )
}
