import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userId, newPassword } = await request.json()

        if (!userId || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
        }

        const supabase = createAdminClient()

        const { error } = await supabase.auth.admin.updateUserById(userId, {
            password: newPassword,
            user_metadata: { password: newPassword }
        })

        if (error) {
            console.error('Error resetting password:', error)
            return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Password updated successfully' })
    } catch (error) {
        console.error('Error in reset-password route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
