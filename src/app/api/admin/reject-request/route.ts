import { NextRequest, NextResponse } from 'next/server'
import { rejectRequest } from '@/lib/actions/admin'

export async function POST(request: NextRequest) {
  try {
    const { requestId, reason } = await request.json()

    if (!requestId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await rejectRequest(requestId, reason)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Request rejected successfully'
    })
  } catch (error) {
    console.error('Error in reject-request API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}