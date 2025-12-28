import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Fetch all users from Auth Admin
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

        if (authError) {
            console.error('Error fetching users:', authError)
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
        }

        // Filter for students (checking metadata or just returning all non-admins?)
        // Best to filter by role in metadata if possible, or join with profiles.
        // For now, let's map the auth data and include `banned_until`.

        const students = users
            .filter(u => u.user_metadata?.role === 'student')
            .map((u: any) => ({
                id: u.id,
                email: u.email,
                full_name: u.user_metadata?.full_name || 'N/A',
                phone: u.user_metadata?.phone || 'N/A',
                created_at: u.created_at,
                is_banned: u.banned_until && new Date(u.banned_until) > new Date(),
                banned_until: u.banned_until,
                password: u.user_metadata?.password
            }))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return NextResponse.json({ students })
    } catch (error) {
        console.error('Error in students route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
