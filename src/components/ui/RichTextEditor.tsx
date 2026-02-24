import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'

interface RichTextEditorProps {
  label?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  error?: string
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = 'Write something...',
  error,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="input__wrapper">
      {label && <label className="input__label">{label}</label>}
      <div className={`rich-text-editor ${error ? 'rich-text-editor--error' : ''}`}>
        <div className="rich-text-editor__toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rich-text-editor__btn ${editor.isActive('bold') ? 'rich-text-editor__btn--active' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <BoldIcon />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rich-text-editor__btn ${editor.isActive('italic') ? 'rich-text-editor__btn--active' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <ItalicIcon />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`rich-text-editor__btn ${editor.isActive('underline') ? 'rich-text-editor__btn--active' : ''}`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`rich-text-editor__btn ${editor.isActive('strike') ? 'rich-text-editor__btn--active' : ''}`}
            title="Strikethrough"
          >
            <StrikeIcon />
          </button>

          <div className="rich-text-editor__divider" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`rich-text-editor__btn ${editor.isActive('heading', { level: 2 }) ? 'rich-text-editor__btn--active' : ''}`}
            title="Heading 2"
          >
            <H2Icon />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`rich-text-editor__btn ${editor.isActive('heading', { level: 3 }) ? 'rich-text-editor__btn--active' : ''}`}
            title="Heading 3"
          >
            <H3Icon />
          </button>

          <div className="rich-text-editor__divider" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rich-text-editor__btn ${editor.isActive('bulletList') ? 'rich-text-editor__btn--active' : ''}`}
            title="Bullet List"
          >
            <BulletListIcon />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`rich-text-editor__btn ${editor.isActive('orderedList') ? 'rich-text-editor__btn--active' : ''}`}
            title="Numbered List"
          >
            <OrderedListIcon />
          </button>

          <div className="rich-text-editor__divider" />

          <button
            type="button"
            onClick={setLink}
            className={`rich-text-editor__btn ${editor.isActive('link') ? 'rich-text-editor__btn--active' : ''}`}
            title="Add Link"
          >
            <LinkIcon />
          </button>
        </div>
        <EditorContent editor={editor} className="rich-text-editor__content" />
      </div>
      {error && <p className="input__error">{error}</p>}
    </div>
  )
}

// Icon Components
function BoldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  )
}

function ItalicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  )
}

function UnderlineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  )
}

function StrikeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M17.5 7.5c0-2-1.5-3.5-5.5-3.5s-5.5 1.5-5.5 3.5c0 4.5 11 4.5 11 9 0 2-1.5 3.5-5.5 3.5s-5.5-1.5-5.5-3.5" />
    </svg>
  )
}

function H2Icon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
    </svg>
  )
}

function H3Icon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
      <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
    </svg>
  )
}

function BulletListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="5" cy="6" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="18" r="1" fill="currentColor" />
    </svg>
  )
}

function OrderedListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <text x="3" y="7" fontSize="6" fill="currentColor" stroke="none">1</text>
      <text x="3" y="13" fontSize="6" fill="currentColor" stroke="none">2</text>
      <text x="3" y="19" fontSize="6" fill="currentColor" stroke="none">3</text>
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}
