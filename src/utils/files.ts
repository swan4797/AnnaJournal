import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase'
import type { Tables } from '~/types/database'

export type FileRecord = Tables<'files'>

/**
 * Fetch files for a specific event
 */
export const fetchEventFiles = createServerFn({ method: 'GET' })
  .inputValidator((data: { eventId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { files: [], error: 'Not authenticated' }
    }

    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .eq('event_id', data.eventId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
      return { files: [], error: error.message }
    }

    return { files: files || [], error: null }
  })

/**
 * Upload a file to storage and create a database record
 */
export const uploadFile = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    eventId: string
    fileName: string
    fileType: string
    fileSize: number
    fileBase64: string
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { file: null, error: 'Not authenticated' }
    }

    // Generate unique file path: userId/eventId/timestamp_filename
    const timestamp = Date.now()
    const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${user.user.id}/${data.eventId}/${timestamp}_${sanitizedFileName}`

    // Convert base64 to buffer
    const base64Data = data.fileBase64.split(',')[1] || data.fileBase64
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('event-files')
      .upload(filePath, buffer, {
        contentType: data.fileType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return { file: null, error: uploadError.message }
    }

    // Create database record
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        event_id: data.eventId,
        user_id: user.user.id,
        file_name: data.fileName,
        file_path: filePath,
        file_type: data.fileType,
        file_size: data.fileSize,
      })
      .select()
      .single()

    if (dbError) {
      // Try to clean up uploaded file
      await supabase.storage.from('event-files').remove([filePath])
      console.error('Error creating file record:', dbError)
      return { file: null, error: dbError.message }
    }

    return { file: fileRecord, error: null }
  })

/**
 * Delete a file from storage and database
 */
export const deleteFile = createServerFn({ method: 'POST' })
  .inputValidator((data: { fileId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get file record first
    const { data: fileRecord, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', data.fileId)
      .single()

    if (fetchError || !fileRecord) {
      return { success: false, error: 'File not found' }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('event-files')
      .remove([fileRecord.file_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue to delete database record anyway
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', data.fileId)

    if (dbError) {
      console.error('Error deleting file record:', dbError)
      return { success: false, error: dbError.message }
    }

    return { success: true, error: null }
  })

/**
 * Get a signed URL for viewing/downloading a file
 */
export const getFileUrl = createServerFn({ method: 'GET' })
  .inputValidator((data: { filePath: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { url: null, error: 'Not authenticated' }
    }

    // Verify file belongs to user (path starts with userId)
    if (!data.filePath.startsWith(user.user.id)) {
      return { url: null, error: 'Access denied' }
    }

    const { data: signedUrl, error } = await supabase.storage
      .from('event-files')
      .createSignedUrl(data.filePath, 3600) // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error)
      return { url: null, error: error.message }
    }

    return { url: signedUrl.signedUrl, error: null }
  })

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let size = bytes

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Get file icon based on type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType === 'application/pdf') return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('sheet') || fileType.includes('excel')) return '📊'
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️'
  return '📎'
}
