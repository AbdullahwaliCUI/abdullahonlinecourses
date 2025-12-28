import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get('courseId')

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Get all enrollments for this course
        const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select(`
                user_id,
                status,
                created_at,
                updated_at
            `)
            .eq('course_id', courseId)
            .neq('status', 'revoked')

        if (enrollError) throw enrollError

        if (!enrollments || enrollments.length === 0) {
            return NextResponse.json({ students: [] })
        }

        // 2. Get all topics for the course (ordered)
        const { data: topics, error: topicError } = await supabase
            .from('topics')
            .select('id, title, order_index')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true })

        if (topicError) throw topicError

        // 3. For each student, get their profile and progress
        const studentIds = enrollments.map(e => e.user_id)

        // Get user profiles from Auth (we need names)
        // Note: In a real large app we'd paginate this or use a profile table join.
        // `listUsers` doesn't support filtering by ID array easily, so we might have to fetch all or use `getUserById` in loop (slow)
        // OR rely on a `profiles` table if it exists and is synced? 
        // The project seemingly uses `auth.users` mostly. 
        // Let's use `listUsers` and filter in memory since we likely don't have >1000 users yet, OR better:
        // Check if there is a public `profiles` table. The usage in `getCurrentUser` implies `profiles` table exists.
        // Let's try to join with `profiles` table if possible by UserId.
        // Actually, `getCurrentUser` joins `profiles`. Let's fetch `profiles` table directly.

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', studentIds)

        if (profileError) throw profileError

        const profileMap = new Map(profiles?.map(p => [p.id, p]))

        // Get progress for all these students in this course
        const { data: progress, error: progressError } = await supabase
            .from('progress')
            .select('user_id, topic_id, is_completed, is_unlocked, updated_at')
            .eq('course_id', courseId)
            .in('user_id', studentIds)

        if (progressError) throw progressError

        // 4. Aggregate Data
        const reportData = enrollments.map(enrollment => {
            const profile = profileMap.get(enrollment.user_id)
            const studentProgress = progress?.filter(p => p.user_id === enrollment.user_id) || []

            // Calculate Progress %
            const completedCount = studentProgress.filter(p => p.is_completed).length
            const totalTopics = topics?.length || 0
            const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0

            // Determine Current Topic
            // Logic: The first topic that is unlocked but NOT completed.
            // If all unlocked are completed, then they are waiting for next unlock? 
            // Or if status is completed, current topic is null.

            let currentTopic = null

            if (enrollment.status === 'completed') {
                currentTopic = null
            } else {
                // Find first unlocked & not completed
                // Sort topics by order
                if (topics) {
                    // Find the "highest" topic they have access to.
                    // Usually we unlock sequentially.
                    // Let's find the first topic where `is_completed` is false but `is_unlocked` is true.

                    const activeTopic = topics.find(topic => {
                        const prog = studentProgress.find(p => p.topic_id === topic.id)
                        return prog?.is_unlocked && !prog.is_completed
                    })

                    if (activeTopic) {
                        currentTopic = {
                            title: activeTopic.title,
                            is_completed: false // Not watched
                        }
                    } else {
                        // If no "unlocked but incomplete" topic found, maybe they just finished a topic and next is locked?
                        // Or maybe they finished ALL topics but enrollment status isn't updated?
                        // Let's check if they completed the LAST topic.
                        const lastTopic = topics[topics.length - 1]
                        const lastProg = studentProgress.find(p => p.topic_id === lastTopic?.id)

                        if (lastProg?.is_completed) {
                            currentTopic = { title: "All Topics Completed", is_completed: true }
                        } else {
                            // Maybe waiting for unlock?
                            // Find the last completed topic
                            // This is complex. Let's simplify: 
                            // Just show the topic with highest order_index that is unlocked.

                            const unlockedTopics = studentProgress.filter(p => p.is_unlocked)
                            // Join with topic order
                            const unlockedWithOrder = unlockedTopics.map(p => {
                                const t = topics.find(t => t.id === p.topic_id)
                                return { ...p, order: t?.order_index || 0, title: t?.title }
                            }).sort((a, b) => b.order - a.order)

                            const latest = unlockedWithOrder[0]
                            if (latest) {
                                currentTopic = {
                                    title: latest.title || 'Unknown',
                                    is_completed: latest.is_completed
                                }
                            } else {
                                // Nothing unlocked?
                                if (topics.length > 0) {
                                    currentTopic = { title: topics[0].title, is_completed: false } // Assume first is next
                                }
                            }
                        }
                    }
                }
            }

            return {
                id: enrollment.user_id,
                name: profile?.full_name || 'Unknown',
                email: profile?.email || 'No Email',
                status: enrollment.status,
                progress_percent: progressPercent,
                current_topic: currentTopic,
                last_active: enrollment.updated_at // or max(progress.updated_at)
            }
        })

        // Sort by last active desc
        reportData.sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime())

        return NextResponse.json({ students: reportData })

    } catch (error) {
        console.error('Report Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
