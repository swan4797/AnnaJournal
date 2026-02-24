import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase'
import type { Tables, TablesInsert, TablesUpdate } from '~/types/database'

export type Event = Tables<'events'>
export type NewEvent = TablesInsert<'events'>
export type UpdateEvent = TablesUpdate<'events'>

/**
 * Fetch events for a date range (typically a month)
 */
export const fetchEvents = createServerFn({ method: 'GET' })
  .inputValidator((data: { start: string; end: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { events: [], error: 'Not authenticated' }
    }

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_time', data.start)
      .lte('start_time', data.end)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return { events: [], error: error.message }
    }

    return { events: events || [], error: null }
  })

/**
 * Fetch a single event by ID
 */
export const fetchEvent = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { event: null, error: 'Not authenticated' }
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', data.id)
      .single()

    if (error) {
      console.error('Error fetching event:', error)
      return { event: null, error: error.message }
    }

    return { event, error: null }
  })

/**
 * Create a new event
 */
export const createEvent = createServerFn({ method: 'POST' })
  .inputValidator((data: Omit<NewEvent, 'user_id'>) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { event: null, error: 'Not authenticated' }
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...data,
        user_id: user.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return { event: null, error: error.message }
    }

    return { event, error: null }
  })

/**
 * Update an existing event
 */
export const updateEvent = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: UpdateEvent }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { event: null, error: 'Not authenticated' }
    }

    const { data: event, error } = await supabase
      .from('events')
      .update(data.updates)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return { event: null, error: error.message }
    }

    return { event, error: null }
  })

/**
 * Delete an event
 */
export const deleteEvent = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Error deleting event:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Toggle event completion status
 */
export const toggleEventComplete = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; completed: boolean }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('events')
      .update({ completed: data.completed })
      .eq('id', data.id)

    if (error) {
      console.error('Error toggling event:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Search events by keyword and/or filter by categories
 */
export const searchEvents = createServerFn({ method: 'GET' })
  .inputValidator((data: {
    query?: string
    categories?: string[]
    startDate?: string
    endDate?: string
    completed?: boolean
    limit?: number
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { events: [], error: 'Not authenticated' }
    }

    let queryBuilder = supabase
      .from('events')
      .select('*')

    // Search by keyword in title, description, and notes
    if (data.query && data.query.trim()) {
      const searchTerm = `%${data.query.trim()}%`
      queryBuilder = queryBuilder.or(
        `title.ilike.${searchTerm},description.ilike.${searchTerm},notes.ilike.${searchTerm}`
      )
    }

    // Filter by categories
    if (data.categories && data.categories.length > 0) {
      queryBuilder = queryBuilder.in('category', data.categories)
    }

    // Filter by date range
    if (data.startDate) {
      queryBuilder = queryBuilder.gte('start_time', data.startDate)
    }
    if (data.endDate) {
      queryBuilder = queryBuilder.lte('start_time', data.endDate)
    }

    // Filter by completion status
    if (data.completed !== undefined) {
      queryBuilder = queryBuilder.eq('completed', data.completed)
    }

    // Order by start time and limit results
    queryBuilder = queryBuilder
      .order('start_time', { ascending: true })
      .limit(data.limit || 50)

    const { data: events, error } = await queryBuilder

    if (error) {
      console.error('Error searching events:', error)
      return { events: [], error: error.message }
    }

    return { events: events || [], error: null }
  })
