import { useState, useEffect } from 'react'
import { Modal } from '~/components/ui'
import { EventForm, type EventFormData, type PendingFile } from './EventForm'
import { createEvent, updateEvent, type Event } from '~/utils/events'
import { uploadFile, fetchEventFiles, type FileRecord } from '~/utils/files'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  onEventCreated: (event: Event) => void
}

export function CreateEventModal({
  isOpen,
  onClose,
  initialDate,
  onEventCreated,
}: CreateEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

  // Reset pending files when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clean up preview URLs
      pendingFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      setPendingFiles([])
    }
  }, [isOpen])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async (data: EventFormData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await createEvent({
        data: {
          title: data.title,
          description: data.description || null,
          notes: data.notes || null,
          start_time: new Date(data.start_time).toISOString(),
          end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
          all_day: data.all_day,
          category: data.category,
          priority: data.priority,
        },
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.event) {
        // Upload any pending files
        if (pendingFiles.length > 0) {
          for (const pendingFile of pendingFiles) {
            const base64 = await fileToBase64(pendingFile.file)
            await uploadFile({
              data: {
                eventId: result.event.id,
                fileName: pendingFile.file.name,
                fileType: pendingFile.file.type,
                fileSize: pendingFile.file.size,
                fileBase64: base64,
              },
            })
          }
        }

        onEventCreated(result.event)
        onClose()
      }
    } catch (err) {
      setError('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Event" size="lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      <EventForm
        initialDate={initialDate}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Create Event"
        loading={loading}
        pendingFiles={pendingFiles}
        onPendingFilesChange={setPendingFiles}
      />
    </Modal>
  )
}

interface EditEventModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event
  onEventUpdated: (event: Event) => void
}

export function EditEventModal({
  isOpen,
  onClose,
  event,
  onEventUpdated,
}: EditEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingFiles, setExistingFiles] = useState<FileRecord[]>([])

  // Fetch existing files when modal opens
  useEffect(() => {
    if (isOpen && event.id) {
      fetchEventFiles({ data: { eventId: event.id } }).then(result => {
        if (result.files) {
          setExistingFiles(result.files)
        }
      })
    }
  }, [isOpen, event.id])

  const handleFileUploaded = (file: FileRecord) => {
    setExistingFiles(prev => [file, ...prev])
  }

  const handleFileDeleted = (fileId: string) => {
    setExistingFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleSubmit = async (data: EventFormData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await updateEvent({
        data: {
          id: event.id,
          updates: {
            title: data.title,
            description: data.description || null,
            notes: data.notes || null,
            start_time: new Date(data.start_time).toISOString(),
            end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
            all_day: data.all_day,
            category: data.category,
            priority: data.priority,
          },
        },
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.event) {
        onEventUpdated(result.event)
        onClose()
      }
    } catch (err) {
      setError('Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  // Convert event data to form data format
  const initialData: Partial<EventFormData> = {
    title: event.title,
    description: event.description || '',
    notes: event.notes || '',
    start_time: event.start_time.replace('Z', '').slice(0, 16),
    end_time: event.end_time?.replace('Z', '').slice(0, 16) || '',
    all_day: event.all_day || false,
    category: event.category as EventFormData['category'],
    priority: (event.priority || 'medium') as EventFormData['priority'],
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Event" size="lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      <EventForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Save Changes"
        loading={loading}
        eventId={event.id}
        existingFiles={existingFiles}
        onFileUploaded={handleFileUploaded}
        onFileDeleted={handleFileDeleted}
      />
    </Modal>
  )
}
