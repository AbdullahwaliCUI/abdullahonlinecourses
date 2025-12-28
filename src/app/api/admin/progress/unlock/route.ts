import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userId, topicId, courseId } = await request.json()

        if (!userId || !topicId || !courseId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Upsert to ensure it exists and is unlocked
        const { error } = await supabase
            .from('progress')
            .upsert({
                user_id: userId,
                course_id: courseId,
                topic_id: topicId,
                is_unlocked: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, course_id, topic_id' })
        // onConflict will merge. If it exists, it updates. If not, it inserts.
        // Note: If we just duplicate the existing record but change is_unlocked, it's fine.
        // But we should be careful not to overwrite `is_completed` if it was already true?
        // Actually, upsert in Supabase (Postgres) by default updates all columns you provide.
        // If we don't provide `is_completed`, does it keep the old value?
        // No, `upsert` replaces the row or updates specified columns. 
        // If I want to *only* update `is_unlocked` if it exists, or insert default if not...
        // Standard upsert might overwrite `is_completed` to null/default if I don't provide it?
        // Wait, `is_completed` has a default.

        // Better approach: Check if exists first.

        //   .select()

        // Let's do a check first to be safe, or use meaningful update.

        const { data: existing } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .eq('topic_id', topicId)
            .single()

        if (existing) {
            const { error: updateError } = await supabase
                .from('progress')
                .update({ is_unlocked: true, updated_at: new Date().toISOString() })
                .eq('id', existing.id)

            if (updateError) throw updateError
        } else {
            const { error: insertError } = await supabase
                .from('progress')
                .insert({
                    user_id: userId,
                    course_id: courseId,
                    topic_id: topicId,
                    is_unlocked: true,
                    is_completed: false
                })

            if (insertError) throw insertError
        }

        return NextResponse.json({ success: true, message: 'Topic unlocked successfully' })
    } catch (error) {
        console.error('Error in unlock route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
