import { useState, type FormEvent } from 'react'
import { Button, Input, Select, RichTextEditor } from '~/components/ui'
import { CATEGORY_LIST, type EventCategory } from '~/utils/categories'
import type { Event, NewEvent } from '~/utils/events'
import { FileUploadPending, type PendingFile } from './FileUpload'
import { FileUpload } from './FileUpload'
import { FileList } from './FileList'
import type { FileRecord } from '~/utils/files'

export interface EventFormData {
  title: string
  description: string
  notes: string
  start_time: string
  end_time: string
  all_day: boolean
  category: EventCategory
  priority: 'low' | 'medium' | 'high'
}

interface EventFormProps {
  initialData?: Partial<EventFormData>
  initialDate?: Date
  onSubmit: (data: EventFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
  // For new events - manage pending files before event is created
  pendingFiles?: PendingFile[]
  onPendingFilesChange?: (files: PendingFile[]) => void
  // For existing events - manage uploaded files
  eventId?: string
  existingFiles?: FileRecord[]
  onFileUploaded?: (file: FileRecord) => void
  onFileDeleted?: (fileId: string) => void
}

export type { PendingFile }

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function EventForm({
  initialData,
  initialDate,
  onSubmit,
  onCancel,
  submitLabel = 'Create Event',
  loading = false,
  pendingFiles,
  onPendingFilesChange,
  eventId,
  existingFiles,
  onFileUploaded,
  onFileDeleted,
}: EventFormProps) {
  const defaultDate = initialDate || new Date()
  const defaultEndDate = new Date(defaultDate.getTime() + 60 * 60 * 1000) // +1 hour

  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
    start_time: initialData?.start_time || formatDateTimeLocal(defaultDate),
    end_time: initialData?.end_time || formatDateTimeLocal(defaultEndDate),
    all_day: initialData?.all_day || false,
    category: initialData?.category || 'task',
    priority: initialData?.priority || 'medium',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required'
    }

    if (!formData.all_day && formData.end_time && formData.start_time > formData.end_time) {
      newErrors.end_time = 'End time must be after start time'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(formData)
  }

  const updateField = <K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="event-form">
      {/* Title */}
      <Input
        label="Title"
        placeholder="Event title"
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={errors.title}
        required
      />

      {/* Category selector */}
      <div className="event-form__field">
        <label className="input__label">Category</label>
        <div className="event-form__categories">
          {CATEGORY_LIST.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => updateField('category', cat.value)}
              className={`event-form__cat-btn event-form__cat-btn--${cat.value} ${formData.category === cat.value ? 'event-form__cat-btn--active' : ''}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* All day toggle */}
      <label className="event-form__checkbox">
        <input
          type="checkbox"
          checked={formData.all_day}
          onChange={(e) => updateField('all_day', e.target.checked)}
        />
        <span>All day event</span>
      </label>

      {/* Date/Time inputs */}
      <div className="event-form__row">
        <Input
          label={formData.all_day ? 'Date' : 'Start'}
          type={formData.all_day ? 'date' : 'datetime-local'}
          value={formData.all_day ? formatDateLocal(new Date(formData.start_time)) : formData.start_time}
          onChange={(e) => updateField('start_time', formData.all_day ? `${e.target.value}T00:00` : e.target.value)}
          error={errors.start_time}
          required
        />
        {!formData.all_day && (
          <Input
            label="End"
            type="datetime-local"
            value={formData.end_time}
            onChange={(e) => updateField('end_time', e.target.value)}
            error={errors.end_time}
          />
        )}
      </div>

      {/* Priority */}
      <Select
        label="Priority"
        value={formData.priority}
        onChange={(e) => updateField('priority', e.target.value as 'low' | 'medium' | 'high')}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]}
      />

      {/* Description */}
      <Input
        label="Description"
        placeholder="Brief description (optional)"
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
      />

      {/* Notes */}
      <RichTextEditor
        label="Notes"
        placeholder="Detailed notes (optional)"
        value={formData.notes}
        onChange={(html) => updateField('notes', html)}
      />

      {/* File Attachments */}
      <div className="event-form__field">
        <label className="input__label">Attachments</label>

        {/* For new events - pending files */}
        {pendingFiles !== undefined && onPendingFilesChange && (
          <FileUploadPending
            files={pendingFiles}
            onFilesChange={onPendingFilesChange}
          />
        )}

        {/* For existing events - file upload and list */}
        {eventId && (
          <div className="event-form__files">
            {existingFiles && existingFiles.length > 0 && (
              <FileList
                files={existingFiles}
                onFileDeleted={onFileDeleted}
                canDelete={true}
              />
            )}
            {onFileUploaded && (
              <FileUpload
                eventId={eventId}
                onFileUploaded={onFileUploaded}
              />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="event-form__actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
