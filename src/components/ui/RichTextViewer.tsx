import DOMPurify from 'dompurify'

interface RichTextViewerProps {
  content: string | null
  className?: string
}

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3',
  'ul', 'ol', 'li', 'a', 'span'
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class']

function isHtmlContent(content: string): boolean {
  return content.trim().startsWith('<')
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function RichTextViewer({ content, className = '' }: RichTextViewerProps) {
  if (!content) {
    return null
  }

  // Handle plain text vs HTML content for backward compatibility
  const htmlContent = isHtmlContent(content)
    ? content
    : `<p>${escapeHtml(content)}</p>`

  const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })

  return (
    <div
      className={`rich-text-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
