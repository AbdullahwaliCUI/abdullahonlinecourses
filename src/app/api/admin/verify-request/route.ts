import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/actions/admin'

export async function POST(request: NextRequest) {
  try {
    const { requestId, email, password, notes } = await request.json()
    // Map email to finalEmail for internal function use
    const finalEmail = email

    if (!requestId || !finalEmail || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(finalEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const result = await verifyRequest(requestId, finalEmail, password, notes)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

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