import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()
        if (!user || user.profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: studentId } = await params
        const supabase = createAdminClient()

        // 1. Get Student Details (Auth + Metadata)
        const { data: { user: studentAuth }, error: authError } = await supabase.auth.admin.getUserById(studentId)

        if (authError || !studentAuth) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        const studentDetails = {
            id: studentAuth.id,
            email: studentAuth.email,
            full_name: studentAuth.user_metadata?.full_name || 'N/A',
            phone: studentAuth.user_metadata?.phone || 'N/A',
        }

        // 2. Get Enrollments (Courses) and status
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id, status, courses(title)')
            .eq('user_id', studentId)
            .neq('status', 'revoked') // Get completed too

        // 3. For each course, get topics and progress
        const coursesProgress = []

        if (enrollments) {
            for (const enrollment of enrollments) {
                // Get all topics for the course
                const { data: topics } = await supabase
                    .from('topics')
                    .select('id, title, order_index')
                    .eq('course_id', enrollment.course_id)
                    .order('order_index')

                // Get student's progress for this course
                const { data: progress } = await supabase
                    .from('progress')
                    .select('topic_id, is_unlocked, is_completed')
                    .eq('user_id', studentId)
                    .eq('course_id', enrollment.course_id)

                // Map progress to topics
                const topicsWithStatus = topics?.map(topic => {
                    const p = progress?.find(p => p.topic_id === topic.id)
                    return {
                        ...topic,
                        is_unlocked: p?.is_unlocked || false,
                        is_completed: p?.is_completed || false
                    }
                }) || []

                coursesProgress.push({
                    course_id: enrollment.course_id,
                    course_title: (enrollment.courses as any)?.title || 'Unknown Course',
                    enrollment_status: enrollment.status,
                    topics: topicsWithStatus
                })
            }
        }

        return NextResponse.json({
            student: studentDetails,
            courses: coursesProgress
        })
    } catch (error) {
        console.error('Error in student progress route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
