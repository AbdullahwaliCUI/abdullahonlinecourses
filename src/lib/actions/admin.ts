'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './auth'
import { initializeFirstTopicOnActivation, unlockNextTopicAfterTest } from './progress'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function verifyRequest(
  requestId: string,
  finalEmail: string,
  password: string,
  notes?: string
) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    // Get the enrollment request
    const { data: request, error: requestError } = await supabase
      .from('enrollment_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single()

    if (requestError || !request) {
      return { error: 'Request not found or already processed' }
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: finalEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name,
        phone: request.phone,
        role: 'student'
      }
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return { error: authError?.message || 'Failed to create user account' }
    }

    // Create enrollment
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id: authData.user.id,
        course_id: request.course_id,
        status: 'active'
      })

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError)
      return { error: 'Failed to create enrollment' }
    }

    // Initialize first topic progress
    const progressResult = await initializeFirstTopicOnActivation(
      authData.user.id,
      request.course_id
    )

    if (progressResult.error) {
      console.error('Error initializing progress:', progressResult.error)
      // Continue anyway - this is not critical
    }

    // Update enrollment request
    const { error: updateError } = await supabase
      .from('enrollment_requests')
      .update({
        status: 'verified',
        processed_by: currentUser.id,
        processed_at: new Date().toISOString(),
        created_user_id: authData.user.id,
        notes: notes || null
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating request:', updateError)
      return { error: 'Failed to update request status' }
    }

    revalidatePath('/admin/requests')

    return {
      success: true,
      email: finalEmail,
      message: 'Student account created successfully'
    }
  } catch (error) {
    console.error('Error in verifyRequest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function rejectRequest(requestId: string, reason: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    const { error } = await supabase
      .from('enrollment_requests')
      .update({
        status: 'rejected',
        processed_by: currentUser.id,
        processed_at: new Date().toISOString(),
        notes: reason
      })
      .eq('id', requestId)
      .eq('status', 'pending')

    if (error) {
      console.error('Error rejecting request:', error)
      return { error: 'Failed to reject request' }
    }

    revalidatePath('/admin/requests')
    return { success: true }
  } catch (error) {
    console.error('Error in rejectRequest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function upsertCourse(
  courseData: {
    id?: string
    title: string
    description?: string
    image_url?: string
  }
) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    const supabase = createAdminClient()

    if (courseData.id) {
      // Update existing course
      const { data, error } = await supabase
        .from('courses')
        .update({
          title: courseData.title,
          description: courseData.description || null,
          image_url: courseData.image_url || null
        })
        .eq('id', courseData.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating course:', error)
        return { error: 'Failed to update course' }
      }

      revalidatePath('/admin/courses')
      return { success: true, course: data }
    } else {
      // Create new course
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description || null,
          image_url: courseData.image_url || null,
          created_by: currentUser.id,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating course:', error)
        return { error: 'Failed to create course' }
      }

      revalidatePath('/admin/courses')
      return { success: true, course: data }
    }
  } catch (error) {
    console.error('Error in upsertCourse FULL OBJECT:', JSON.stringify(error, null, 2))
    console.error('Error in upsertCourse:', error)
    return { error: 'An unexpected error occurred during course creation: ' + (error as any).message }
  }
}

export async function upsertTopic(
  topicData: {
    id?: string
    course_id: string
    title: string
    order_index: number
    is_preview?: boolean
  }
) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    if (topicData.id) {
      // Update existing topic
      const { data, error } = await supabase
        .from('topics')
        .update({
          title: topicData.title,
          order_index: topicData.order_index
        })
        .eq('id', topicData.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating topic:', error)
        return { error: 'Failed to update topic' }
      }

      revalidatePath('/admin/courses')
      return { success: true, topic: data }
    } else {
      // Create new topic
      const { data, error } = await supabase
        .from('topics')
        .insert({
          course_id: topicData.course_id,
          title: topicData.title,
          order_index: topicData.order_index,
          is_preview: topicData.is_preview || false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating topic:', error)
        return { error: 'Failed to create topic' }
      }

      revalidatePath('/admin/courses')
      return { success: true, topic: data }
    }
  } catch (error) {
    console.error('Error in upsertTopic:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function upsertVideo(
  videoData: {
    id?: string
    topic_id: string
    title: string
    youtube_url?: string
    admin_video_url?: string
    helper_material_url?: string
    document_url?: string
  }
) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    if (videoData.id) {
      // Update existing video
      const { data, error } = await supabase
        .from('videos')
        .update({
          title: videoData.title,
          youtube_url: videoData.youtube_url || null,
          admin_video_url: videoData.admin_video_url || null,
          helper_material_url: videoData.helper_material_url || null,
          document_url: videoData.document_url || null
        })
        .eq('id', videoData.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating video:', error)
        return { error: 'Failed to update video' }
      }

      revalidatePath('/admin/courses')
      return { success: true, video: data }
    } else {
      // Create new video
      const { data, error } = await supabase
        .from('videos')
        .insert({
          topic_id: videoData.topic_id,
          title: videoData.title,
          youtube_url: videoData.youtube_url || null,
          admin_video_url: videoData.admin_video_url || null,
          helper_material_url: videoData.helper_material_url || null,
          document_url: videoData.document_url || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating video:', error)
        return { error: 'Failed to create video' }
      }

      revalidatePath('/admin/courses')
      return { success: true, video: data }
    }
  } catch (error) {
    console.error('Error in upsertVideo:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function createTest(
  testData: {
    course_id: string
    topic_id: string
    title: string
    scheduled_at?: string
  }
) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('tests')
      .insert({
        course_id: testData.course_id,
        topic_id: testData.topic_id,
        title: testData.title,
        scheduled_at: testData.scheduled_at || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating test:', error)
      return { error: 'Failed to create test' }
    }

    revalidatePath('/admin/tests')
    return { success: true, test: data }
  } catch (error) {
    console.error('Error in createTest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function gradeAttempt(
  attemptData: {
    test_id: string
    user_id: string
    marks_obtained: number
    total_marks: number
  }
) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    // Get test details to find topic and course
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('topic_id, course_id')
      .eq('id', attemptData.test_id)
      .single()

    if (testError || !test) {
      return { error: 'Test not found' }
    }

    // Update or create test attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .upsert({
        test_id: attemptData.test_id,
        user_id: attemptData.user_id,
        marks_obtained: attemptData.marks_obtained,
        total_marks: attemptData.total_marks,
        status: 'graded',
        graded_by: currentUser.id,
        graded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (attemptError) {
      console.error('Error grading attempt:', attemptError)
      return { error: 'Failed to grade attempt' }
    }

    // Mark current topic as completed
    await supabase
      .from('progress')
      .upsert({
        user_id: attemptData.user_id,
        course_id: test.course_id,
        topic_id: test.topic_id,
        is_unlocked: true,
        is_completed: true,
        updated_at: new Date().toISOString()
      })

    // Unlock next topic if test passed (assuming 60% pass rate)
    const passPercentage = (attemptData.marks_obtained / attemptData.total_marks) * 100
    if (passPercentage >= 60) {
      await unlockNextTopicAfterTest(
        attemptData.user_id,
        test.course_id,
        test.topic_id
      )
    }

    revalidatePath('/admin/tests')
    return { success: true, attempt }
  } catch (error) {
    console.error('Error in gradeAttempt:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function createInstructorUser({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone: string }) {
  const supabase = createAdminClient()

  try {
    // 1. Create User in Supabase Auth
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone,
        role: 'instructor'
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return { error: createError.message }
    }

    if (!userData.user) return { error: 'User creation failed' }

    // 2. Ensure Profile exists and has correct role 
    // (Trigger might handle creation, but we want to ensure Role is set correctly)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'instructor', phone: phone, full_name: fullName }) // Ensure sync
      .eq('id', userData.user.id)

    if (profileError) {
      // If update fails, maybe trigger hasn't run yet? or row doesn't exist?
      // With the trigger `handle_new_user`, the row should exist.
      console.error('Error updating profile role:', profileError)
      // We can try upsert just in case trigger failed
      await supabase.from('profiles').upsert({
        id: userData.user.id,
        role: 'instructor',
        full_name: fullName,
        phone: phone
      })
    }

    revalidatePath('/admin/instructors')
    return { success: true, userId: userData.user.id }

  } catch (error: any) {
    console.error('Server Action Error:', error)
    return { error: 'Internal Server Error' }
  }
}

export async function deleteCourse(courseId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      console.error('Error deleting course:', error)
      return { error: 'Failed to delete course' }
    }

    revalidatePath('/admin/courses')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteCourse:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteTopic(topicId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId)

    if (error) {
      console.error('Error deleting topic:', error)
      return { error: 'Failed to delete topic' }
    }

    revalidatePath('/admin/courses')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteTopic:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteVideo(videoId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId)

    if (error) {
      console.error('Error deleting video:', error)
      return { error: 'Failed to delete video' }
    }

    revalidatePath('/admin/courses')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteVideo:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteTest(testId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  try {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', testId)

    if (error) {
      console.error('Error deleting test:', error)
      return { error: 'Failed to delete test' }
    }

    revalidatePath('/admin/tests')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteTest:', error)
    return { error: 'An unexpected error occurred' }
  }
}