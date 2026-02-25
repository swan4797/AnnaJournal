import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase'
import type { Tables, TablesInsert, TablesUpdate } from '~/types/database'

export type Class = Tables<'classes'>
export type NewClass = TablesInsert<'classes'>
export type UpdateClass = TablesUpdate<'classes'>
export type ClassException = Tables<'class_exceptions'>
export type NewClassException = TablesInsert<'class_exceptions'>

// Color palette for classes
export const CLASS_COLORS = [
  { value: 'blue', label: 'Blue', hex: '#3B82F6' },
  { value: 'green', label: 'Green', hex: '#22C55E' },
  { value: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { value: 'orange', label: 'Orange', hex: '#F97316' },
  { value: 'pink', label: 'Pink', hex: '#EC4899' },
  { value: 'cyan', label: 'Cyan', hex: '#06B6D4' },
  { value: 'amber', label: 'Amber', hex: '#F59E0B' },
  { value: 'rose', label: 'Rose', hex: '#F43F5E' },
] as const

// Day of week mapping
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const

/**
 * Fetch all classes for user
 */
export const fetchClasses = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { classes: [], error: 'Not authenticated' }
    }

    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .order('title', { ascending: true })

    if (error) {
      console.error('Error fetching classes:', error)
      return { classes: [], error: error.message }
    }

    return { classes: classes || [], error: null }
  })

/**
 * Create a new class and generate event instances
 */
export const createClass = createServerFn({ method: 'POST' })
  .inputValidator((data: Omit<NewClass, 'user_id'>) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { class: null, error: 'Not authenticated' }
    }

    // Insert the class
    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({ ...data, user_id: user.user.id })
      .select()
      .single()

    if (error) {
      console.error('Error creating class:', error)
      return { class: null, error: error.message }
    }

    // Generate event instances
    await generateClassEvents(supabase, newClass, user.user.id)

    return { class: newClass, error: null }
  })

/**
 * Update a class - regenerates events if schedule changed
 */
export const updateClass = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: UpdateClass }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { class: null, error: 'Not authenticated' }
    }

    // Get the old class to check if schedule changed
    const { data: oldClass } = await supabase
      .from('classes')
      .select('*')
      .eq('id', data.id)
      .single()

    // Update the class
    const { data: updatedClass, error } = await supabase
      .from('classes')
      .update(data.updates)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating class:', error)
      return { class: null, error: error.message }
    }

    // Check if schedule-related fields changed
    const scheduleChanged = oldClass && (
      JSON.stringify(oldClass.days_of_week) !== JSON.stringify(data.updates.days_of_week) ||
      oldClass.start_time !== data.updates.start_time ||
      oldClass.end_time !== data.updates.end_time ||
      oldClass.semester_start !== data.updates.semester_start ||
      oldClass.semester_end !== data.updates.semester_end
    )

    if (scheduleChanged) {
      // Delete old events and regenerate
      await supabase.from('events').delete().eq('parent_class_id', data.id)
      await generateClassEvents(supabase, updatedClass, user.user.id)
    } else if (data.updates.title || data.updates.location) {
      // Just update title/location on existing events
      const updates: Record<string, string | null> = {}
      if (data.updates.title) updates.title = data.updates.title
      if (data.updates.location !== undefined) updates.description = data.updates.location

      await supabase
        .from('events')
        .update(updates)
        .eq('parent_class_id', data.id)
    }

    return { class: updatedClass, error: null }
  })

/**
 * Delete a class and its generated events
 */
export const deleteClass = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Events with parent_class_id will cascade delete
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Error deleting class:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Create an exception for a specific class occurrence
 */
export const createClassException = createServerFn({ method: 'POST' })
  .inputValidator((data: Omit<NewClassException, 'id' | 'created_at'>) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { exception: null, error: 'Not authenticated' }
    }

    // Insert exception
    const { data: exception, error } = await supabase
      .from('class_exceptions')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating exception:', error)
      return { exception: null, error: error.message }
    }

    // Update the corresponding event
    const eventDate = new Date(data.exception_date)
    const startOfDay = new Date(eventDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(eventDate)
    endOfDay.setHours(23, 59, 59, 999)

    if (data.exception_type === 'cancelled') {
      // Delete the event instance for this date
      await supabase
        .from('events')
        .delete()
        .eq('parent_class_id', data.class_id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
    } else {
      // Update time/location for rescheduled/moved
      const updates: Record<string, string> = {}

      if (data.new_start_time && data.new_end_time) {
        const [startHour, startMin] = data.new_start_time.split(':').map(Number)
        const [endHour, endMin] = data.new_end_time.split(':').map(Number)

        const newStart = new Date(eventDate)
        newStart.setHours(startHour, startMin, 0, 0)
        const newEnd = new Date(eventDate)
        newEnd.setHours(endHour, endMin, 0, 0)

        updates.start_time = newStart.toISOString()
        updates.end_time = newEnd.toISOString()
      }

      if (data.new_location) {
        updates.description = data.new_location
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('events')
          .update(updates)
          .eq('parent_class_id', data.class_id)
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString())
      }
    }

    return { exception, error: null }
  })

/**
 * Fetch exceptions for a class
 */
export const fetchClassExceptions = createServerFn({ method: 'GET' })
  .inputValidator((data: { classId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { exceptions: [], error: 'Not authenticated' }
    }

    const { data: exceptions, error } = await supabase
      .from('class_exceptions')
      .select('*')
      .eq('class_id', data.classId)
      .order('exception_date', { ascending: true })

    if (error) {
      console.error('Error fetching exceptions:', error)
      return { exceptions: [], error: error.message }
    }

    return { exceptions: exceptions || [], error: null }
  })

/**
 * Delete an exception
 */
export const deleteClassException = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('class_exceptions')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Error deleting exception:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Helper: Generate event instances for a class within semester bounds
 */
async function generateClassEvents(supabase: ReturnType<typeof getSupabaseServerClient>, classData: Class, userId: string) {
  const events: Array<{
    user_id: string
    title: string
    description: string | null
    start_time: string
    end_time: string
    category: string
    parent_class_id: string
  }> = []

  const semesterStart = new Date(classData.semester_start)
  const semesterEnd = new Date(classData.semester_end)

  // Parse time strings (HH:MM:SS format)
  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number)
    return { hour: parts[0], minute: parts[1] || 0 }
  }

  const startTimeParts = parseTime(classData.start_time)
  const endTimeParts = parseTime(classData.end_time)

  // Iterate through each day in the semester
  const current = new Date(semesterStart)
  while (current <= semesterEnd) {
    const dayOfWeek = current.getDay()

    if (classData.days_of_week.includes(dayOfWeek)) {
      const startTime = new Date(current)
      startTime.setHours(startTimeParts.hour, startTimeParts.minute, 0, 0)

      const endTime = new Date(current)
      endTime.setHours(endTimeParts.hour, endTimeParts.minute, 0, 0)

      events.push({
        user_id: userId,
        title: classData.title,
        description: classData.location || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        category: 'lecture',
        parent_class_id: classData.id,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  // Batch insert events (Supabase supports up to 1000 rows per insert)
  const batchSize = 500
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize)
    const { error } = await supabase.from('events').insert(batch)
    if (error) {
      console.error('Error inserting events batch:', error)
    }
  }
}

/**
 * Helper: Get color hex from color name
 */
export function getClassColorHex(colorName: string | null): string {
  const color = CLASS_COLORS.find(c => c.value === colorName)
  return color?.hex || '#3B82F6'
}

/**
 * Helper: Format time for display (HH:MM:SS -> h:mm AM/PM)
 */
export function formatClassTime(timeStr: string): string {
  const [hour, minute] = timeStr.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

/**
 * Helper: Format days for display
 */
export function formatClassDays(daysOfWeek: number[]): string {
  return daysOfWeek
    .sort((a, b) => a - b)
    .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.short || '')
    .join(', ')
}
