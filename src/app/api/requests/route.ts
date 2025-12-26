import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrollmentRequestSchema } from '@/lib/utils/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request data
    const validatedData = enrollmentRequestSchema.parse(body)
    
    // Use admin client to insert enrollment request
    const supabase = createAdminClient()
    
    // First, verify the course exists and is active
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', validatedData.courseId)
      .eq('is_active', true)
      .single()
    
    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found or inactive' },
        { status: 404 }
      )
    }
    
    // Insert enrollment request
    const { data: enrollmentRequest, error: insertError } = await supabase
      .from('enrollment_requests')
      .insert({
        course_id: validatedData.courseId,
        full_name: validatedData.full_name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        transaction_id: validatedData.transaction_id,
        receipt_url: validatedData.receipt_url,
        notes: validatedData.notes || null,
        status: 'pending'
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error inserting enrollment request:', insertError)
      
      // Check for duplicate transaction ID
      if (insertError.code === '23505' && insertError.message.includes('transaction_id')) {
        return NextResponse.json(
          { error: 'This transaction ID has already been used. Please check your transaction details.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to submit enrollment request. Please try again.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Your request has been submitted. You will receive login credentials after admin approval.',
      requestId: enrollmentRequest.id
    })
    
  } catch (error: any) {
    console.error('Error processing enrollment request:', error)
    
    // Handle Zod validation errors
    if (error.errors) {
      const fieldErrors: Record<string, string> = {}
      error.errors.forEach((err: any) => {
        if (err.path && err.path.length > 0) {
          fieldErrors[err.path[0]] = err.message
        }
      })
      
      return NextResponse.json(
        { error: 'Validation failed', errors: fieldErrors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}