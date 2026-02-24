import { type TextareaHTMLAttributes, forwardRef } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="input__wrapper">
        {label && (
          <label htmlFor={textareaId} className="input__label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`textarea ${error ? 'input--error' : ''} ${className}`}
          {...props}
        />
        {error && <p className="input__error">{error}</p>}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
