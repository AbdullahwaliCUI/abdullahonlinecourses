import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/actions/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('=== verify-request API called ===')
    const { requestId, finalEmail, password, notes } = await request.json()
    
    console.log('API request data:', { 
      requestId, 
      finalEmail, 
      passwordLength: password?.length,
      hasNotes: !!notes 
    })

    if (!requestId || !finalEmail || !password) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(finalEmail)) {
      console.log('Invalid email format')
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log('Calling verifyRequest function...')
    const result = await verifyRequest(requestId, finalEmail, password, notes)
    
    console.log('verifyRequest result:', result)

    if (result.error) {
      console.log('verifyRequest returned error:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    console.log('=== verify-request API completed successfully ===')
    return NextResponse.json({
      success: true,
      email: result.email,
      message: result.message
    })
  } catch (error) {
    console.error('Error in verify-request API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}