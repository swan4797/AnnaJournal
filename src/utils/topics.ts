import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase'
import type { Tables, TablesInsert, TablesUpdate } from '~/types/database'

export type ExamTopic = Tables<'exam_topics'>
export type NewExamTopic = TablesInsert<'exam_topics'>
export type UpdateExamTopic = TablesUpdate<'exam_topics'>

/**
 * Fetch all topics for an exam
 */
export const fetchExamTopics = createServerFn({ method: 'GET' })
  .inputValidator((data: { examId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { topics: [], error: 'Not authenticated' }
    }

    const { data: topics, error } = await supabase
      .from('exam_topics')
      .select('*')
      .eq('event_id', data.examId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching exam topics:', error)
      return { topics: [], error: error.message }
    }

    return { topics: topics || [], error: null }
  })

/**
 * Create a new topic for an exam
 */
export const createExamTopic = createServerFn({ method: 'POST' })
  .inputValidator((data: { event_id: string; topic_name: string; description?: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { topic: null, error: 'Not authenticated' }
    }

    // Get the max sort_order for this exam to append at end
    const { data: existingTopics } = await supabase
      .from('exam_topics')
      .select('sort_order')
      .eq('event_id', data.event_id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = existingTopics && existingTopics.length > 0
      ? (existingTopics[0].sort_order || 0) + 1
      : 0

    const { data: topic, error } = await supabase
      .from('exam_topics')
      .insert({
        event_id: data.event_id,
        user_id: user.user.id,
        topic_name: data.topic_name,
        description: data.description || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating exam topic:', error)
      return { topic: null, error: error.message }
    }

    return { topic, error: null }
  })

/**
 * Update a topic (name, description, completed, confidence)
 */
export const updateExamTopic = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: UpdateExamTopic }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { topic: null, error: 'Not authenticated' }
    }

    const { data: topic, error } = await supabase
      .from('exam_topics')
      .update(data.updates)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating exam topic:', error)
      return { topic: null, error: error.message }
    }

    return { topic, error: null }
  })

/**
 * Delete a topic
 */
export const deleteExamTopic = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('exam_topics')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Error deleting exam topic:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Bulk create topics (for quick add multiple topics at once)
 */
export const bulkCreateExamTopics = createServerFn({ method: 'POST' })
  .inputValidator((data: { examId: string; topicNames: string[] }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { topics: [], error: 'Not authenticated' }
    }

    // Get the max sort_order for this exam
    const { data: existingTopics } = await supabase
      .from('exam_topics')
      .select('sort_order')
      .eq('event_id', data.examId)
      .order('sort_order', { ascending: false })
      .limit(1)

    let nextSortOrder = existingTopics && existingTopics.length > 0
      ? (existingTopics[0].sort_order || 0) + 1
      : 0

    const topicsToInsert = data.topicNames.map((name, index) => ({
      event_id: data.examId,
      user_id: user.user!.id,
      topic_name: name.trim(),
      sort_order: nextSortOrder + index,
    }))

    const { data: topics, error } = await supabase
      .from('exam_topics')
      .insert(topicsToInsert)
      .select()

    if (error) {
      console.error('Error bulk creating exam topics:', error)
      return { topics: [], error: error.message }
    }

    return { topics: topics || [], error: null }
  })

/**
 * Toggle topic completion status
 */
export const toggleTopicComplete = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; completed: boolean }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('exam_topics')
      .update({ completed: data.completed })
      .eq('id', data.id)

    if (error) {
      console.error('Error toggling topic completion:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })

/**
 * Update topic confidence rating
 */
export const updateTopicConfidence = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; confidence: number }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate confidence is between 0-5
    const confidence = Math.min(5, Math.max(0, data.confidence))

    const { error } = await supabase
      .from('exam_topics')
      .update({ confidence })
      .eq('id', data.id)

    if (error) {
      console.error('Error updating topic confidence:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  })
