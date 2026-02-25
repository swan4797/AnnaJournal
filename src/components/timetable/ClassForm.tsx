import { useState, type FormEvent } from 'react'
import { Button, Input, Select, RichTextEditor } from '~/components/ui'
import { CLASS_COLORS, type Class } from '~/utils/classes'
import { DayPicker } from './DayPicker'
import type { Event } from '~/utils/events'

export interface ClassFormData {
  title: string
  module_code: string
  module_name: string
  instructor: string
  location: string
  days_of_week: number[]
  start_time: string
  end_time: string
  semester_start: string
  semester_end: string
  color: string
  notes: string
  linked_exam_id: string | null
}

interface ClassFormProps {
  initialData?: Partial<ClassFormData>
  initialDayOfWeek?: number
  initialHour?: number
  onSubmit: (data: ClassFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
  exams?: Event[]
}

function formatDateLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTimeLocal(hour: number, minute: number = 0): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export function ClassForm({
  initialData,
  initialDayOfWeek,
  initialHour,
  onSubmit,
  onCancel,
  submitLabel = 'Create Class',
  loading = false,
  exams = [],
}: ClassFormProps) {
  // Default semester dates (current month to +4 months)
  const today = new Date()
  const semesterEnd = new Date(today)
  semesterEnd.setMonth(semesterEnd.getMonth() + 4)

  // Default time if clicking on grid
  const defaultStartHour = initialHour ?? 9
  const defaultEndHour = defaultStartHour + 1

  const [formData, setFormData] = useState<ClassFormData>({
    title: initialData?.title || '',
    module_code: initialData?.module_code || '',
    module_name: initialData?.module_name || '',
    instructor: initialData?.instructor || '',
    location: initialData?.location || '',
    days_of_week: initialData?.days_of_week || (initialDayOfWeek !== undefined ? [initialDayOfWeek] : []),
    start_time: initialData?.start_time || formatTimeLocal(defaultStartHour),
    end_time: initialData?.end_time || formatTimeLocal(defaultEndHour),
    semester_start: initialData?.semester_start || formatDateLocal(today),
    semester_end: initialData?.semester_end || formatDateLocal(semesterEnd),
    color: initialData?.color || 'blue',
    notes: initialData?.notes || '',
    linked_exam_id: initialData?.linked_exam_id || null,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ClassFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClassFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (formData.days_of_week.length === 0) {
      newErrors.days_of_week = 'Select at least one day'
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required'
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required'
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'End time must be after start time'
    }

    if (!formData.semester_start) {
      newErrors.semester_start = 'Semester start is required'
    }

    if (!formData.semester_end) {
      newErrors.semester_end = 'Semester end is required'
    }

    if (formData.semester_start && formData.semester_end && formData.semester_start >= formData.semester_end) {
      newErrors.semester_end = 'Semester end must be after start'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(formData)
  }

  const updateField = <K extends keyof ClassFormData>(field: K, value: ClassFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="class-form">
      {/* Title */}
      <Input
        label="Class Title"
        placeholder="e.g., Anatomy Lecture"
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={errors.title}
        required
      />

      {/* Module Code & Name */}
      <div className="class-form__row">
        <Input
          label="Module Code"
          placeholder="e.g., ANAT101"
          value={formData.module_code}
          onChange={(e) => updateField('module_code', e.target.value)}
        />
        <Input
          label="Module Name"
          placeholder="e.g., Human Anatomy"
          value={formData.module_name}
          onChange={(e) => updateField('module_name', e.target.value)}
        />
      </div>

      {/* Instructor & Location */}
      <div className="class-form__row">
        <Input
          label="Instructor"
          placeholder="e.g., Dr. Smith"
          value={formData.instructor}
          onChange={(e) => updateField('instructor', e.target.value)}
        />
        <Input
          label="Location"
          placeholder="e.g., Room 204"
          value={formData.location}
          onChange={(e) => updateField('location', e.target.value)}
        />
      </div>

      {/* Days of Week */}
      <div className="class-form__field">
        <label className="input__label">Days of Week</label>
        <DayPicker
          selectedDays={formData.days_of_week}
          onChange={(days) => updateField('days_of_week', days)}
        />
        {errors.days_of_week && (
          <span className="input__error">{errors.days_of_week}</span>
        )}
      </div>

      {/* Time */}
      <div className="class-form__row">
        <Input
          label="Start Time"
          type="time"
          value={formData.start_time}
          onChange={(e) => updateField('start_time', e.target.value)}
          error={errors.start_time}
          required
        />
        <Input
          label="End Time"
          type="time"
          value={formData.end_time}
          onChange={(e) => updateField('end_time', e.target.value)}
          error={errors.end_time}
          required
        />
      </div>

      {/* Semester Dates */}
      <div className="class-form__row">
        <Input
          label="Semester Start"
          type="date"
          value={formData.semester_start}
          onChange={(e) => updateField('semester_start', e.target.value)}
          error={errors.semester_start}
          required
        />
        <Input
          label="Semester End"
          type="date"
          value={formData.semester_end}
          onChange={(e) => updateField('semester_end', e.target.value)}
          error={errors.semester_end}
          required
        />
      </div>

      {/* Color picker */}
      <div className="class-form__field">
        <label className="input__label">Color</label>
        <div className="class-form__colors">
          {CLASS_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => updateField('color', color.value)}
              className={`class-form__color-btn ${formData.color === color.value ? 'class-form__color-btn--active' : ''}`}
              style={{ backgroundColor: color.hex }}
              title={color.label}
              aria-label={color.label}
              aria-pressed={formData.color === color.value}
            />
          ))}
        </div>
      </div>

      {/* Linked Exam */}
      {exams.length > 0 && (
        <Select
          label="Linked Exam (optional)"
          value={formData.linked_exam_id || ''}
          onChange={(e) => updateField('linked_exam_id', e.target.value || null)}
          options={[
            { value: '', label: 'None' },
            ...exams.map(exam => ({
              value: exam.id,
              label: exam.title,
            })),
          ]}
        />
      )}

      {/* Notes */}
      <RichTextEditor
        label="Notes"
        placeholder="Additional notes (optional)"
        value={formData.notes}
        onChange={(html) => updateField('notes', html)}
      />

      {/* Actions */}
      <div className="class-form__actions">
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
