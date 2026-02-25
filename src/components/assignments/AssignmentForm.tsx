import { useState, type FormEvent } from 'react'
import { Button, Input, Select } from '~/components/ui'
import { RichTextEditor } from '~/components/ui/RichTextEditor'
import { ASSIGNMENT_PRIORITIES, type Assignment } from '~/utils/assignments'
import type { Class } from '~/utils/classes'

export interface AssignmentFormData {
  title: string
  description: string
  instructions: string
  due_date: string
  due_time: string
  linked_class_id: string | null
  priority: 'low' | 'medium' | 'high'
  max_grade: number | null
  weight: number | null
}

interface AssignmentFormProps {
  initialData?: Partial<AssignmentFormData>
  onSubmit: (data: AssignmentFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
  classes?: Class[]
}

function formatDateTimeLocal(date: Date): { date: string; time: string } {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

export function AssignmentForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Assignment',
  loading = false,
  classes = [],
}: AssignmentFormProps) {
  // Default to tomorrow at 11:59 PM
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 0, 0)
  const defaultDateTime = formatDateTimeLocal(tomorrow)

  const [formData, setFormData] = useState<AssignmentFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    instructions: initialData?.instructions || '',
    due_date: initialData?.due_date || defaultDateTime.date,
    due_time: initialData?.due_time || defaultDateTime.time,
    linked_class_id: initialData?.linked_class_id || null,
    priority: initialData?.priority || 'medium',
    max_grade: initialData?.max_grade ?? 100,
    weight: initialData?.weight ?? null,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof AssignmentFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AssignmentFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(formData)
  }

  const updateField = <K extends keyof AssignmentFormData>(
    field: K,
    value: AssignmentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form className="assignment-form" onSubmit={handleSubmit}>
      {/* Title */}
      <Input
        label="Title"
        placeholder="Assignment title"
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={errors.title}
        required
      />

      {/* Description */}
      <Input
        label="Description"
        placeholder="Brief description"
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
      />

      {/* Due Date & Time */}
      <div className="assignment-form__row">
        <Input
          type="date"
          label="Due Date"
          value={formData.due_date}
          onChange={(e) => updateField('due_date', e.target.value)}
          error={errors.due_date}
          required
        />
        <Input
          type="time"
          label="Due Time"
          value={formData.due_time}
          onChange={(e) => updateField('due_time', e.target.value)}
        />
      </div>

      {/* Class & Priority */}
      <div className="assignment-form__row">
        <Select
          label="Class"
          value={formData.linked_class_id || ''}
          onChange={(e) => updateField('linked_class_id', e.target.value || null)}
          options={[
            { value: '', label: 'No class' },
            ...classes.map((c) => ({
              value: c.id,
              label: c.module_name || c.title,
            })),
          ]}
        />
        <Select
          label="Priority"
          value={formData.priority}
          onChange={(e) => updateField('priority', e.target.value as 'low' | 'medium' | 'high')}
          options={ASSIGNMENT_PRIORITIES.map((p) => ({
            value: p.value,
            label: p.label,
          }))}
        />
      </div>

      {/* Grading */}
      <div className="assignment-form__row">
        <Input
          type="number"
          label="Max Grade"
          placeholder="100"
          value={formData.max_grade?.toString() || ''}
          onChange={(e) => updateField('max_grade', e.target.value ? parseFloat(e.target.value) : null)}
          min={0}
        />
        <Input
          type="number"
          label="Weight (%)"
          placeholder="e.g., 10"
          value={formData.weight?.toString() || ''}
          onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : null)}
          min={0}
          max={100}
        />
      </div>

      {/* Instructions */}
      <RichTextEditor
        label="Instructions"
        placeholder="Detailed instructions for this assignment..."
        value={formData.instructions}
        onChange={(html) => updateField('instructions', html)}
      />

      {/* Actions */}
      <div className="assignment-form__actions">
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
