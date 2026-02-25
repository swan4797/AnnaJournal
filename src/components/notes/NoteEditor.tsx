import { useState, useEffect } from 'react'
import { RichTextEditor } from '~/components/ui/RichTextEditor'
import type { Note, NewNote, UpdateNote } from '~/utils/notes'
import type { Event } from '~/utils/events'

interface NoteEditorProps {
  note?: Note
  onSave: (data: Omit<NewNote, 'user_id'> | { id: string; updates: UpdateNote }) => void
  onCancel: () => void
  exams?: Event[]
}

const COLORS = [
  { name: 'None', value: '' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
]

export function NoteEditor({ note, onSave, onCancel, exams = [] }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [subject, setSubject] = useState(note?.subject || '')
  const [tags, setTags] = useState<string[]>(note?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [color, setColor] = useState(note?.color || '')
  const [linkedExamId, setLinkedExamId] = useState(note?.linked_exam_id || '')
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!note

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    setIsSaving(true)

    try {
      if (isEditing && note) {
        onSave({
          id: note.id,
          updates: {
            title: title.trim(),
            content,
            subject: subject.trim() || null,
            tags: tags.length > 0 ? tags : null,
            color: color || null,
            linked_exam_id: linkedExamId || null,
          },
        })
      } else {
        onSave({
          title: title.trim(),
          content,
          subject: subject.trim() || null,
          tags: tags.length > 0 ? tags : null,
          color: color || null,
          linked_exam_id: linkedExamId || null,
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = tagInput.trim().replace(',', '')
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  // Filter exams to only show upcoming ones
  const upcomingExams = exams.filter(exam =>
    exam.category === 'exam' && new Date(exam.start_time) > new Date()
  )

  return (
    <form className="note-editor" onSubmit={handleSubmit}>
      <div className="note-editor__header">
        <h2 className="note-editor__heading">
          {isEditing ? 'Edit Note' : 'New Note'}
        </h2>
        <div className="note-editor__actions">
          <button
            type="button"
            className="note-editor__btn note-editor__btn--cancel"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="note-editor__btn note-editor__btn--save"
            disabled={!title.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="note-editor__body">
        <div className="note-editor__main">
          <input
            type="text"
            className="note-editor__title-input"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your note..."
          />
        </div>

        <div className="note-editor__sidebar">
          <div className="note-editor__field">
            <label className="note-editor__label">Subject</label>
            <input
              type="text"
              className="note-editor__input"
              placeholder="e.g., Anatomy"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="note-editor__field">
            <label className="note-editor__label">Tags</label>
            <div className="note-editor__tags">
              {tags.map((tag) => (
                <span key={tag} className="note-editor__tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="note-editor__tag-remove"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="note-editor__tag-input"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>

          <div className="note-editor__field">
            <label className="note-editor__label">Color</label>
            <div className="note-editor__colors">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`note-editor__color ${color === c.value ? 'note-editor__color--selected' : ''}`}
                  style={{ backgroundColor: c.value || '#e5e7eb' }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {upcomingExams.length > 0 && (
            <div className="note-editor__field">
              <label className="note-editor__label">Link to Exam</label>
              <select
                className="note-editor__select"
                value={linkedExamId}
                onChange={(e) => setLinkedExamId(e.target.value)}
              >
                <option value="">None</option>
                {upcomingExams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
