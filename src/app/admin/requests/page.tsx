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
  course_id: string
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
  const [courses, setCourses] = useState<{ id: string, title: string }[]>([]) // Available courses for filter
  const [selectedCourseId, setSelectedCourseId] = useState<string>('') // Filter state
  const [loading, setLoading] = useState(true)
  const [verifyModal, setVerifyModal] = useState<VerifyModalData | null>(null)
  const [rejectModal, setRejectModal] = useState<RejectModalData | null>(null)
  const [processing, setProcessing] = useState(false)

  // ... (Verify/Reject generic states)

  // Fetch data
  useEffect(() => {
    fetchRequests()
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses list:', error)
    }
  }

  // ... (fetchRequests implementation same as before) ...

  // Filter requests
  const filteredRequests = selectedCourseId
    ? requests.filter(r => r.course_id === selectedCourseId)
    : requests

  // ... (Modal handlers) ...

  // ... (Loading check) ...

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enrollment Requests</h1>
              <p className="text-gray-600 mt-2">Review and process pending student enrollment requests</p>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[200px]"
              >
                <option value="">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <Link
                href="/admin"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            {/* ... SVG ... */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-600">
              {selectedCourseId ? 'No pending requests for the selected course.' : 'All enrollment requests have been processed.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                {/* ... Table Header ... */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    // ... Row ...

                    {/* Requests Table */ }
        {
                      requests.length === 0 ? (
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
                                      {request.receipt_url ? (
                                        <a
                                          href={request.receipt_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                          View Receipt →
                                        </a>
                                      ) : (
                                        <span className="text-gray-400 text-sm italic">No receipt attached</span>
                                      )}
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
                      )
                    }
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