import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase'
import type { Tables, TablesInsert, TablesUpdate } from '~/types/database'

export type Note = Tables<'notes'>
export type NewNote = TablesInsert<'notes'>
export type UpdateNote = TablesUpdate<'notes'>

/**
 * Fetch all notes for user (with optional filters)
 */
export const fetchNotes = createServerFn({ method: 'GET' })
  .inputValidator((data: {
    subject?: string
    search?: string
    limit?: number
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { notes: [], error: 'Not authenticated' }
    }

    let queryBuilder = supabase
      .from('notes')
      .select('*')

    // Filter by subject
    if (data.subject) {
      queryBuilder = queryBuilder.eq('subject', data.subject)
    }

    // Search by keyword in title and content
    if (data.search && data.search.trim()) {
      const searchTerm = `%${data.search.trim()}%`
      queryBuilder = queryBuilder.or(
        `title.ilike.${searchTerm},content.ilike.${searchTerm}`
      )
    }

    // Order by pinned first, then by updated_at
    queryBuilder = queryBuilder
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(data.limit || 50)

    const { data: notes, error } = await queryBuilder

    if (error) {
      console.error('Error fetching notes:', error)
      return { notes: [], error: error.message }
    }

    return { notes: notes || [], error: null }
  })

/**
 * Fetch a single note by ID
 */
export const fetchNote = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { note: null, error: 'Not authenticated' }
    }

    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', data.id)
      .single()

    if (error) {
      console.error('Error fetching note:', error)
      return { note: null, error: error.message }
    }

    return { note, error: null }
  })

/**
 * Create a new note
 */
export const createNote = createServerFn({ method: 'POST' })
  .inputValidator((data: Omit<NewNote, 'user_id'>) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { note: null, error: 'Not authenticated' }
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        ...data,
        user_id: user.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating note:', error)
      return { note: null, error: error.message }
    }

    return { note, error: null }
  })

/**
 * Update an existing note
 */
export const updateNote = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: UpdateNote }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { note: null, error: 'Not authenticated' }
    }

    const { data: note, error } = await supabase
      .from('notes')
      .update(data.updates)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating note:', error)
      return { note: null, error: error.message }
    }

    return { note, error: null }
  })

/**
 * Delete a note
 */
export const deleteNote = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Error deleting note:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Toggle note pinned status
 */
export const toggleNotePinned = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; pinned: boolean }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('notes')
      .update({ pinned: data.pinned })
      .eq('id', data.id)

    if (error) {
      console.error('Error toggling note pinned:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Get unique subjects for filter dropdown
 */
export const fetchNoteSubjects = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { subjects: [], error: 'Not authenticated' }
    }

    const { data: notes, error } = await supabase
      .from('notes')
      .select('subject')
      .not('subject', 'is', null)

    if (error) {
      console.error('Error fetching subjects:', error)
      return { subjects: [], error: error.message }
    }

    // Extract unique subjects
    const subjects = [...new Set(notes?.map(n => n.subject).filter(Boolean) as string[])]

    return { subjects, error: null }
  })

/**
 * Fetch notes linked to a specific class
 */
export const fetchNotesByClass = createServerFn({ method: 'GET' })
  .inputValidator((data: { classId: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { notes: [], error: 'Not authenticated' }
    }

    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('linked_class_id', data.classId)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(data.limit || 20)

    if (error) {
      console.error('Error fetching notes by class:', error)
      return { notes: [], error: error.message }
    }

    return { notes: notes || [], error: null }
  })
