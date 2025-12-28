import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userId, courseId } = await request.json()

        if (!userId || !courseId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Update enrollment status to 'completed'
        // This signifies the certificate has been issued/approved by admin
        const { error } = await supabase
            .from('enrollments')
            .update({
                status: 'completed',
                // We might ideally want a completed_at timestamp, but schema might not have it.
                // We will rely on status='completed' for now.
            })
            .eq('user_id', userId)
            .eq('course_id', courseId)

        if (error) {
            console.error('Error issuing certificate:', error)
            return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Certificate issued successfully' })
    } catch (error) {
        console.error('Error in certificate issue route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
