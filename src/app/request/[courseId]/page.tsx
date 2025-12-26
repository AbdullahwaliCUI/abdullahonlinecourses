'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { enrollmentRequestSchema, type EnrollmentRequestData } from '@/lib/utils/validators'

interface Course {
  id: string
  title: string
  description: string | null
  image_url: string | null
}

export default function RequestEnrollmentPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    transaction_id: '',
    receipt_url: '',
    notes: ''
  })

  const jazzCashNumber = process.env.NEXT_PUBLIC_JAZZCASH_NUMBER

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const courseData = await response.json()
        setCourse(courseData)
      } else {
        console.error('Course not found')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      // Validate form data
      const validatedData = enrollmentRequestSchema.parse({
        courseId,
        ...formData
      })

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitted(true)
      } else {
        if (result.errors) {
          setErrors(result.errors)
        } else {
          setErrors({ general: result.error || 'Failed to submit request' })
        }
      }
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: 'Failed to submit request. Please try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </main>
    )
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you're trying to enroll in doesn't exist.</p>
          <Link 
            href="/courses"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your enrollment request has been submitted successfully. You will receive login credentials after admin approval.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong><br />
              Our admin team will verify your payment and create your account within 24-48 hours.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={`/courses/${courseId}`}
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Course
            </Link>
            <Link
              href="/courses"
              className="block w-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              Browse More Courses
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {course.image_url && (
            <div className="relative h-32 w-full">
              <Image
                src={course.image_url}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Request Enrollment: {course.title}
            </h1>
            {course.description && (
              <p className="text-gray-600">
                {course.description}
              </p>
            )}
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            📱 Payment Instructions
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Step 1: Send Payment</h3>
              <div className="space-y-2">
                <p className="text-blue-800">
                  <strong>JazzCash Number:</strong> 
                  <span className="ml-2 text-lg font-mono bg-yellow-100 px-2 py-1 rounded">
                    {jazzCashNumber}
                  </span>
                </p>
                <p className="text-sm text-blue-700">
                  Contact admin for course pricing information
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Step 2: Submit Form Below</h3>
              <p className="text-blue-800 text-sm">
                After sending payment, fill out the enrollment form with your transaction details and receipt.
              </p>
            </div>
          </div>
        </div>

        {/* Enrollment Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Enrollment Request Form
          </h2>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.full_name ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+92 300 1234567"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <p className="mt-1 text-sm text-gray-500">
                If not provided, admin will create an email for your account
              </p>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JazzCash Transaction ID *
              </label>
              <input
                type="text"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleInputChange}
                placeholder="Enter your JazzCash transaction ID"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.transaction_id ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.transaction_id && (
                <p className="mt-1 text-sm text-red-600">{errors.transaction_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Screenshot URL *
              </label>
              <input
                type="url"
                name="receipt_url"
                value={formData.receipt_url}
                onChange={handleInputChange}
                placeholder="https://drive.google.com/... or GitHub raw URL"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.receipt_url ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload your payment screenshot to Google Drive, GitHub, or similar service and paste the public link here
              </p>
              {errors.receipt_url && (
                <p className="mt-1 text-sm text-red-600">{errors.receipt_url}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.notes ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Any additional information or questions..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {submitting ? 'Submitting Request...' : 'Submit Enrollment Request'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={`/courses/${courseId}`}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Course Details
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}