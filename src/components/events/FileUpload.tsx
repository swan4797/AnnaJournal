import { useState, useRef, type ChangeEvent } from 'react'
import { uploadFile, formatFileSize, getFileIcon, type FileRecord } from '~/utils/files'

interface FileUploadProps {
  eventId: string
  onFileUploaded: (file: FileRecord) => void
  maxSizeMB?: number
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]

export function FileUpload({ eventId, onFileUploaded, maxSizeMB = 10 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const handleFileSelect = async (file: File) => {
    setError(null)

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('File type not supported. Please upload PDF, images, or documents.')
      return
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    setUploading(true)

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file)

      const result = await uploadFile({
        data: {
          eventId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileBase64: base64,
        },
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.file) {
        onFileUploaded(result.file)
      }
    } catch (err) {
      setError('Failed to upload file')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <div className="file-upload">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="file-upload__input"
        disabled={uploading}
      />

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`file-upload__dropzone ${dragOver ? 'file-upload__dropzone--active' : ''} ${uploading ? 'file-upload__dropzone--uploading' : ''}`}
      >
        {uploading ? (
          <div className="file-upload__uploading">
            <span className="spinner" />
            <span className="file-upload__text">Uploading...</span>
          </div>
        ) : (
          <div className="file-upload__placeholder">
            <svg className="file-upload__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <span className="file-upload__link">Click to upload</span>
              <span className="file-upload__text"> or drag and drop</span>
            </div>
            <span className="file-upload__hint">
              PDF, images, documents up to {maxSizeMB}MB
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="file-upload__error">{error}</p>
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export interface PendingFile {
  file: File
  preview?: string
}

interface FileUploadPendingProps {
  files: PendingFile[]
  onFilesChange: (files: PendingFile[]) => void
  maxSizeMB?: number
}

/**
 * File upload component for use before event is created
 * Stores files locally until form submission
 */
export function FileUploadPending({ files, onFilesChange, maxSizeMB = 10 }: FileUploadPendingProps) {
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const handleFileSelect = (file: File) => {
    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('File type not supported')
      return
    }

    if (file.size > maxSizeBytes) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    // Create preview for images
    let preview: string | undefined
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }

    onFilesChange([...files, { file, preview }])
  }

  const handleRemove = (index: number) => {
    const newFiles = [...files]
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!)
    }
    newFiles.splice(index, 1)
    onFilesChange(newFiles)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className="file-upload-pending">
      {/* File list */}
      {files.length > 0 && (
        <div className="file-upload-pending__list">
          {files.map((f, index) => (
            <div key={index} className="file-item file-item--pending">
              <span className="file-item__icon">{getFileIcon(f.file.type)}</span>
              <div className="file-item__info">
                <p className="file-item__name">{f.file.name}</p>
                <p className="file-item__size">{formatFileSize(f.file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="file-item__remove"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="file-upload__input"
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`file-upload__dropzone file-upload__dropzone--compact ${dragOver ? 'file-upload__dropzone--active' : ''}`}
      >
        <div className="file-upload__add">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add attachment</span>
        </div>
      </div>

      {error && (
        <p className="file-upload__error">{error}</p>
      )}
    </div>
  )
}
