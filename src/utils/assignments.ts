import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase'
import type { Tables, TablesInsert, TablesUpdate } from '~/types/database'

export type Assignment = Tables<'assignments'>
export type NewAssignment = TablesInsert<'assignments'>
export type UpdateAssignment = TablesUpdate<'assignments'>

// Status labels and colors
export const ASSIGNMENT_STATUSES = [
  { value: 'not_started', label: 'Not Started', color: '#6B7280' },
  { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { value: 'submitted', label: 'Submitted', color: '#F59E0B' },
  { value: 'graded', label: 'Graded', color: '#22C55E' },
] as const

export const ASSIGNMENT_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6B7280' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' },
] as const

/**
 * Fetch all assignments for user (with optional filters)
 */
export const fetchAssignments = createServerFn({ method: 'GET' })
  .inputValidator((data: {
    classId?: string
    status?: string
    upcoming?: boolean
    limit?: number
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { assignments: [], error: 'Not authenticated' }
    }

    let queryBuilder = supabase
      .from('assignments')
      .select('*')

    // Filter by class
    if (data.classId) {
      queryBuilder = queryBuilder.eq('linked_class_id', data.classId)
    }

    // Filter by status
    if (data.status) {
      queryBuilder = queryBuilder.eq('status', data.status)
    }

    // Filter upcoming (due date >= now)
    if (data.upcoming) {
      queryBuilder = queryBuilder.gte('due_date', new Date().toISOString())
    }

    // Order by due date
    queryBuilder = queryBuilder
      .order('due_date', { ascending: true })
      .limit(data.limit || 50)

    const { data: assignments, error } = await queryBuilder

    if (error) {
      console.error('Error fetching assignments:', error)
      return { assignments: [], error: error.message }
    }

    return { assignments: assignments || [], error: null }
  })

/**
 * Fetch a single assignment by ID
 */
export const fetchAssignment = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { assignment: null, error: 'Not authenticated' }
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', data.id)
      .single()

    if (error) {
      console.error('Error fetching assignment:', error)
      return { assignment: null, error: error.message }
    }

    return { assignment, error: null }
  })

/**
 * Create a new assignment (also creates calendar event)
 */
export const createAssignment = createServerFn({ method: 'POST' })
  .inputValidator((data: Omit<NewAssignment, 'user_id'>) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { assignment: null, error: 'Not authenticated' }
    }

    // Create the assignment
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        ...data,
        user_id: user.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return { assignment: null, error: error.message }
    }

    // Create corresponding calendar event for due date
    if (assignment) {
      const { error: eventError } = await supabase
        .from('events')
        .insert({
          user_id: user.user.id,
          title: `Due: ${assignment.title}`,
          category: 'assignment',
          start_time: assignment.due_date,
          all_day: false,
          parent_assignment_id: assignment.id,
          priority: assignment.priority,
        })

      if (eventError) {
        console.error('Error creating assignment event:', eventError)
        // Don't fail the whole operation, assignment was created
      }
    }

    return { assignment, error: null }
  })

/**
 * Update an existing assignment
 */
export const updateAssignment = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: UpdateAssignment }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { assignment: null, error: 'Not authenticated' }
    }

    // Update the assignment
    const { data: assignment, error } = await supabase
      .from('assignments')
      .update(data.updates)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      return { assignment: null, error: error.message }
    }

    // Update corresponding calendar event if due date or title changed
    if (assignment && (data.updates.due_date || data.updates.title || data.updates.completed !== undefined)) {
      const eventUpdates: Record<string, unknown> = {}

      if (data.updates.due_date) {
        eventUpdates.start_time = data.updates.due_date
      }
      if (data.updates.title) {
        eventUpdates.title = `Due: ${data.updates.title}`
      }
      if (data.updates.completed !== undefined) {
        eventUpdates.completed = data.updates.completed
      }
      if (data.updates.priority) {
        eventUpdates.priority = data.updates.priority
      }

      if (Object.keys(eventUpdates).length > 0) {
        await supabase
          .from('events')
          .update(eventUpdates)
          .eq('parent_assignment_id', data.id)
      }
    }

    return { assignment, error: null }
  })

/**
 * Delete an assignment (cascades to event)
 */
export const deleteAssignment = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Error deleting assignment:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Update assignment status
 */
export const updateAssignmentStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    id: string
    status: 'not_started' | 'in_progress' | 'submitted' | 'graded'
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const updates: UpdateAssignment = { status: data.status }

    // Set timestamps based on status
    if (data.status === 'submitted') {
      updates.submitted_at = new Date().toISOString()
    } else if (data.status === 'graded') {
      updates.graded_at = new Date().toISOString()
      updates.completed = true
    }

    const { error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', data.id)

    if (error) {
      console.error('Error updating assignment status:', error)
      return { success: false, error: error.message }
    }

    // Update event completion status
    if (data.status === 'graded' || data.status === 'submitted') {
      await supabase
        .from('events')
        .update({ completed: data.status === 'graded' })
        .eq('parent_assignment_id', data.id)
    }

    return { success: true, error: null }
  })

/**
 * Grade an assignment
 */
export const gradeAssignment = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    id: string
    grade: number
    feedback?: string
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('assignments')
      .update({
        grade: data.grade,
        feedback: data.feedback || null,
        status: 'graded',
        graded_at: new Date().toISOString(),
        completed: true,
      })
      .eq('id', data.id)

    if (error) {
      console.error('Error grading assignment:', error)
      return { success: false, error: error.message }
    }

    // Mark event as completed
    await supabase
      .from('events')
      .update({ completed: true })
      .eq('parent_assignment_id', data.id)

    return { success: true, error: null }
  })

/**
 * Fetch assignments by class
 */
export const fetchAssignmentsByClass = createServerFn({ method: 'GET' })
  .inputValidator((data: { classId: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { assignments: [], error: 'Not authenticated' }
    }

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('linked_class_id', data.classId)
      .order('due_date', { ascending: true })
      .limit(data.limit || 20)

    if (error) {
      console.error('Error fetching assignments by class:', error)
      return { assignments: [], error: error.message }
    }

    return { assignments: assignments || [], error: null }
  })

// Helper functions
export function getStatusLabel(status: string): string {
  return ASSIGNMENT_STATUSES.find(s => s.value === status)?.label || status
}

export function getStatusColor(status: string): string {
  return ASSIGNMENT_STATUSES.find(s => s.value === status)?.color || '#6B7280'
}

export function getPriorityLabel(priority: string | null): string {
  if (!priority) return 'Medium'
  return ASSIGNMENT_PRIORITIES.find(p => p.value === priority)?.label || priority
}

export function getPriorityColor(priority: string | null): string {
  if (!priority) return '#F59E0B'
  return ASSIGNMENT_PRIORITIES.find(p => p.value === priority)?.color || '#F59E0B'
}

export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`
  } else if (diffDays === 0) {
    return 'Due today'
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}
