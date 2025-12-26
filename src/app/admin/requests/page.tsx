'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { adminVerifySchema, adminRejectSchema } from '@/lib/utils/validators'
import { toast } from '@/lib/utils/toast'
import { LoadingButton } from '@/components/LoadingSpinner'
import LoadingSpinner from '@/components/LoadingSpinner'

interface EnrollmentRequest {
  id: string
  created_at: string
  full_name: string
  phone: string
  email: string | null
  transaction_id: string
  receipt_url: string
  status: string
  notes: string | null
  courses: {
    title: string
  }
}

interface VerifyModalData {
  requestId: string
  fullName: string
  email: string
  courseTitle: string
}

interface RejectModalData {
  requestId: string
  fullName: string
  courseTitle: string
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyModal, setVerifyModal] = useState<VerifyModalData | null>(null)
  const [rejectModal, setRejectModal] = useState<RejectModalData | null>(null)
  const [processing, setProcessing] = useState(false)

  // Verify modal form state
  const [finalEmail, setFinalEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notes, setNotes] = useState('')

  // Reject modal form state
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('enrollment_requests')
        .select(`
          *,
          courses(title)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load requests', 'Please refresh the page to try again.')
    } finally {
      setLoading(false)
    }
  }

  const openVerifyModal = (request: EnrollmentRequest) => {
    setVerifyModal({
      requestId: request.id,
      fullName: request.full_name,
      email: request.email || '',
      courseTitle: request.courses.title
    })
    setFinalEmail(request.email || `${request.full_name.toLowerCase().replace(/\s+/g, '.')}@student.lms.com`)
    setPassword('')
    setNotes('')
  }

  const openRejectModal = (request: EnrollmentRequest) => {
    setRejectModal({
      requestId: request.id,
      fullName: request.full_name,
      courseTitle: request.courses.title
    })
    setRejectReason('')
  }

  const handleVerify = async () => {
    if (!verifyModal || !finalEmail || !password) return

    setProcessing(true)
    try {
      // Validate form data
      const validatedData = adminVerifySchema.parse({
        requestId: verifyModal.requestId,
        email: finalEmail,
        password,
        notes
      })

      const response = await fetch('/api/admin/verify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(
          'Student account created successfully!',
          `Email: ${result.email} | Password: ${password}`
        )
        setVerifyModal(null)
        fetchRequests()
      } else {
        toast.error('Failed to create account', result.error || 'Please try again.')
      }
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const errorMessages = error.errors.map((err: any) => err.message).join(', ')
        toast.error('Validation errors', errorMessages)
      } else {
        toast.error('Failed to verify request', 'Please try again.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) return

    setProcessing(true)
    try {
      // Validate form data
      const validatedData = adminRejectSchema.parse({
        requestId: rejectModal.requestId,
        reason: rejectReason
      })

      const response = await fetch('/api/admin/reject-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Request rejected', 'The enrollment request has been rejected.')
        setRejectModal(null)
        fetchRequests()
      } else {
        toast.error('Failed to reject request', result.error || 'Please try again.')
      }
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const errorMessages = error.errors.map((err: any) => err.message).join(', ')
        toast.error('Validation errors', errorMessages)
      } else {
        toast.error('Failed to reject request', 'Please try again.')
      }
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading enrollment requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enrollment Requests</h1>
              <p className="text-gray-600 mt-2">Review and process pending student enrollment requests</p>
            </div>
            <Link
              href="/admin"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Requests Table */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Requests</h3>
            <p className="text-gray-600">All enrollment requests have been processed.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.courses.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.phone}
                        </div>
                        {request.email && (
                          <div className="text-sm text-gray-500">
                            {request.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.transaction_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={request.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Receipt →
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => openVerifyModal(request)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Verify & Create Student
                        </button>
                        <button
                          onClick={() => openRejectModal(request)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Verify Modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Verify & Create Student Account</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Student:</strong> {verifyModal.fullName}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Course:</strong> {verifyModal.courseTitle}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Email *
                </label>
                <input
                  type="email"
                  value={finalEmail}
                  onChange={(e) => setFinalEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Set password for student"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <LoadingButton
                onClick={handleVerify}
                loading={processing}
                disabled={!finalEmail || !password}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Create Student Account
              </LoadingButton>
              <button
                onClick={() => setVerifyModal(null)}
                disabled={processing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Enrollment Request</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Student:</strong> {rejectModal.fullName}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Course:</strong> {rejectModal.courseTitle}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="Please provide a reason for rejecting this request..."
                required
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <LoadingButton
                onClick={handleReject}
                loading={processing}
                disabled={!rejectReason}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject Request
              </LoadingButton>
              <button
                onClick={() => setRejectModal(null)}
                disabled={processing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}