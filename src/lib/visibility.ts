import { createClient } from '@/lib/supabase/server'

export async function getVisibleTopicsForPublic(courseId: string) {
  const supabase = await createClient()

  try {
    // Fetch all topics for the course ordered by order_index
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching topics:', error)
      return { topics: [], visibleCount: 0, totalCount: 0 }
    }

    // We now return all topics and let the UI decide what to show based on is_preview
    // or enrollment status.
    const totalCount = topics?.length || 0
    const visibleCount = totalCount // Show all topics in the list

    return {
      topics: topics || [],
      visibleCount,
      totalCount
    }
  } catch (error) {
    console.error('Error in getVisibleTopicsForPublic:', error)
    return { topics: [], visibleCount: 0, totalCount: 0 }
  }
}

export async function getIsEnrolledActive(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select('status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .single()

    if (error) {
      // No enrollment found or other error
      return false
    }

    return enrollment?.status === 'active'
  } catch (error) {
    console.error('Error checking enrollment status:', error)
    return false
  }
}

export async function getUserEnrollmentStatus(userId: string | null, courseId: string) {
  if (!userId) {
    return { isEnrolled: false, isActive: false }
  }

  const isActive = await getIsEnrolledActive(userId, courseId)

  return {
    isEnrolled: isActive, // For now, we only consider active enrollments
    isActive
  }
}