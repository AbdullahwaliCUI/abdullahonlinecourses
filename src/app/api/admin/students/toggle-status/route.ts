import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userId, action } = await request.json()
        // action: 'activate' | 'deactivate'

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createAdminClient()

        let error;
        if (action === 'deactivate') {
            // Ban for 100 years
            const oneHundredYears = 100 * 365 * 24 * 60 * 60; // seconds approx
            // Wait, ban_duration is string like '87600h'
            const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
                ban_duration: '876000h' // ~100 years
            })
            error = banError
        } else {
            // Unban
            const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
                ban_duration: '0s' // Remove ban
            })
            error = unbanError;
        }

        if (error) {
            console.error('Error toggling status:', error)
            return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in toggle-status route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
