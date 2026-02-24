import { useState } from 'react'
import { Button } from '~/components/ui'
import { getFileUrl, deleteFile, formatFileSize, getFileIcon, type FileRecord } from '~/utils/files'

interface FileListProps {
  files: FileRecord[]
  onFileDeleted?: (fileId: string) => void
  canDelete?: boolean
}

export function FileList({ files, onFileDeleted, canDelete = true }: FileListProps) {
  if (files.length === 0) {
    return null
  }

  return (
    <div className="file-list">
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          onDeleted={onFileDeleted}
          canDelete={canDelete}
        />
      ))}
    </div>
  )
}

interface FileItemProps {
  file: FileRecord
  onDeleted?: (fileId: string) => void
  canDelete: boolean
}

function FileItem({ file, onDeleted, canDelete }: FileItemProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleView = async () => {
    setLoading(true)
    try {
      const result = await getFileUrl({ data: { filePath: file.file_path } })
      if (result.url) {
        window.open(result.url, '_blank')
      }
    } catch (err) {
      console.error('Failed to get file URL:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setLoading(true)
    try {
      const result = await getFileUrl({ data: { filePath: file.file_path } })
      if (result.url) {
        const link = document.createElement('a')
        link.href = result.url
        link.download = file.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      console.error('Failed to download file:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteFile({ data: { fileId: file.id } })
      if (result.success && onDeleted) {
        onDeleted(file.id)
      }
    } catch (err) {
      console.error('Failed to delete file:', err)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const isImage = file.file_type.startsWith('image/')
  const isPDF = file.file_type === 'application/pdf'

  return (
    <div className="file-item">
      {/* Icon */}
      <div className="file-item__icon-box">
        <span className="file-item__icon">{getFileIcon(file.file_type)}</span>
      </div>

      {/* File info */}
      <div className="file-item__info">
        <p className="file-item__name">{file.file_name}</p>
        <p className="file-item__size">{formatFileSize(file.file_size)}</p>
      </div>

      {/* Actions */}
      <div className="file-item__actions">
        {(isImage || isPDF) && (
          <button
            onClick={handleView}
            disabled={loading}
            className="file-item__btn file-item__btn--view"
            title="View"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}

        <button
          onClick={handleDownload}
          disabled={loading}
          className="file-item__btn file-item__btn--download"
          title="Download"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        {canDelete && (
          <>
            {confirmDelete ? (
              <div className="file-item__confirm">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="file-item__confirm-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="file-item__confirm-btn file-item__confirm-btn--danger"
                >
                  {deleting ? '...' : 'Delete'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="file-item__btn file-item__btn--delete"
                title="Delete"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface FileListCompactProps {
  files: FileRecord[]
}

/**
 * Compact file list for sidebar/preview
 */
export function FileListCompact({ files }: FileListCompactProps) {
  const [loadingFile, setLoadingFile] = useState<string | null>(null)

  const handleView = async (file: FileRecord) => {
    setLoadingFile(file.id)
    try {
      const result = await getFileUrl({ data: { filePath: file.file_path } })
      if (result.url) {
        window.open(result.url, '_blank')
      }
    } catch (err) {
      console.error('Failed to get file URL:', err)
    } finally {
      setLoadingFile(null)
    }
  }

  if (files.length === 0) {
    return null
  }

  return (
    <div className="file-list file-list--compact">
      {files.map((file) => (
        <button
          key={file.id}
          onClick={() => handleView(file)}
          disabled={loadingFile === file.id}
          className="file-item file-item--compact"
        >
          <span className="file-item__icon">{getFileIcon(file.file_type)}</span>
          <span className="file-item__name">{file.file_name}</span>
          <span className="file-item__size">{formatFileSize(file.file_size)}</span>
        </button>
      ))}
    </div>
  )
}
