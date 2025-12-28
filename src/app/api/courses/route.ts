import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = createClient()

    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, description, created_at')
        .eq('is_published', true)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(courses)
}
