'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './auth'

/**
 * Initialize first topic progress when a student enrollment is activated
 * Finds the topic with the smallest order_index and creates progress entry with is_unlocked=true
 */
export async function initializeFirstTopicOnActivation(userId: string, courseId: string) {
  const supabase = createAdminClient()

  try {
    // Get the first topic (smallest order_index) for the course
    const { data: firstTopic, error: topicError } = await supabase
      .from('topics')
      .select('id, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })
      .limit(1)
      .single()

    if (topicError || !firstTopic) {
      console.error('Error finding first topic:', topicError)
      return { error: 'No topics found for course' }
    }

    // Upsert progress entry for first topic with is_unlocked=true
    const { error: progressError } = await supabase
      .from('progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        topic_id: firstTopic.id,
        is_unlocked: true,
        is_completed: false,
        updated_at: new Date().toISOString()
      })

    if (progressError) {
      console.error('Error initializing progress:', progressError)
      return { error: 'Failed to initialize progress' }
    }

    return { success: true, topicId: firstTopic.id }
  } catch (error) {
    console.error('Error in initializeFirstTopicOnActivation:', error)
    return { error: 'Failed to initialize first topic' }
  }
}

/**
 * Unlock next topic after a test is completed and graded
 * Finds the topic with the next higher order_index and sets its progress.is_unlocked=true
 */
export async function unlockNextTopicAfterTest(userId: string, courseId: string, topicIdCompleted: string) {
  const supabase = createAdminClient()

  try {
    // Get completed topic's order_index
    const { data: completedTopic, error: completedTopicError } = await supabase
      .from('topics')
      .select('order_index')
      .eq('id', topicIdCompleted)
      .eq('course_id', courseId)
      .single()

    if (completedTopicError || !completedTopic) {
      console.error('Error finding completed topic:', completedTopicError)
      return { error: 'Completed topic not found' }
    }

    // Find next topic with higher order_index
    const { data: nextTopic, error: nextTopicError } = await supabase
      .from('topics')
      .select('id, order_index')
      .eq('course_id', courseId)
      .gt('order_index', completedTopic.order_index)
      .order('order_index', { ascending: true })
      .limit(1)
      .single()

    if (nextTopicError || !nextTopic) {
      // No next topic found - this is the last topic
      return { success: true, message: 'No more topics to unlock - course completed' }
    }

    // Upsert progress entry for next topic with is_unlocked=true
    const { error: progressError } = await supabase
      .from('progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        topic_id: nextTopic.id,
        is_unlocked: true,
        is_completed: false,
        updated_at: new Date().toISOString()
      })

    if (progressError) {
      console.error('Error unlocking next topic:', progressError)
      return { error: 'Failed to unlock next topic' }
    }

    return { success: true, nextTopicId: nextTopic.id, message: 'Next topic unlocked successfully' }
  } catch (error) {
    console.error('Error in unlockNextTopicAfterTest:', error)
    return { error: 'Failed to unlock next topic' }
  }
}

/**
 * Mark a topic as completed by a student
 * Can be called from student interface when they finish a topic
 */
export async function markTopicCompleted(userId: string, courseId: string, topicId: string) {
  const supabase = createAdminClient()

  try {
    // Verify the topic exists and belongs to the course
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id')
      .eq('id', topicId)
      .eq('course_id', courseId)
      .single()

    if (topicError || !topic) {
      return { error: 'Topic not found' }
    }

    // Check current progress
    const { data: existingProgress } = await supabase
      .from('progress')
      .select('id, is_unlocked, is_completed')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('topic_id', topicId)
      .single()

    if (!existingProgress) {
      return { error: 'Topic not accessible - no progress record found' }
    }

    if (!existingProgress.is_unlocked) {
      return { error: 'Topic is not unlocked yet' }
    }

    if (existingProgress.is_completed) {
      return { success: true, message: 'Topic already completed' }
    }

    // Mark as completed
    const { error: updateError } = await supabase
      .from('progress')
      .update({ 
        is_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)

    if (updateError) {
      console.error('Error marking topic completed:', updateError)
      return { error: 'Failed to mark topic as completed' }
    }

    return { success: true, message: 'Topic marked as completed' }
  } catch (error) {
    console.error('Error in markTopicCompleted:', error)
    return { error: 'Failed to mark topic as completed' }
  }
}

/**
 * Get user's progress for a specific course
 * Returns all progress entries with topic information
 */
export async function getUserCourseProgress(userId: string, courseId: string) {
  const supabase = createAdminClient()

  try {
    const { data: progress, error } = await supabase
      .from('progress')
      .select(`
        *,
        topics (
          id,
          title,
          order_index
        )
      `)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('topics(order_index)', { ascending: true })

    if (error) {
      console.error('Error fetching user progress:', error)
      return { error: 'Failed to fetch progress' }
    }

    return { success: true, progress: progress || [] }
  } catch (error) {
    console.error('Error in getUserCourseProgress:', error)
    return { error: 'Failed to fetch progress' }
  }
}

/**
 * Check if a specific topic is unlocked for a user
 */
export async function isTopicUnlocked(userId: string, courseId: string, topicId: string): Promise<boolean> {
  const supabase = createAdminClient()

  try {
    const { data: progress } = await supabase
      .from('progress')
      .select('is_unlocked')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('topic_id', topicId)
      .single()

    return progress?.is_unlocked || false
  } catch (error) {
    console.error('Error checking topic unlock status:', error)
    return false
  }
}