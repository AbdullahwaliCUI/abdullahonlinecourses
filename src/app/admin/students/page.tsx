'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from '@/lib/utils/toast'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Student {
    id: string
    email: string
    full_name: string
    phone: string
    created_at: string
    is_banned: boolean
    banned_until?: string
    password?: string
}

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [courses, setCourses] = useState<{ id: string, title: string }[]>([])
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')
    const [reportData, setReportData] = useState<any[]>([])

    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [reportLoading, setReportLoading] = useState(false)
    const [reportTab, setReportTab] = useState<'all' | 'pending' | 'watched' | 'completed'>('all')

    // Password reset state
    const [resetModal, setResetModal] = useState<{ id: string, name: string } | null>(null)
    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        fetchStudents()
        fetchCourses()
    }, [])

    useEffect(() => {
        if (selectedCourseId) {
            fetchReport(selectedCourseId)
        } else {
            setReportData([])
        }
    }, [selectedCourseId])

    const fetchCourses = async () => {
        try {
            // We need a route for this, assume generic /api/courses works or creating one?
            // Existing app usually has public /api/courses. Let's try that first 
            // OR fetch from admin endpoints if available.
            // Let's rely on the public one for titles.
            const res = await fetch('/api/courses')
            if (res.ok) {
                const data = await res.json()
                setCourses(data)
            }
        } catch (error) {
            console.error('Error loading courses', error)
        }
    }

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/admin/students')
            const data = await res.json()
            if (res.ok) {
                setStudents(data.students)
            } else {
                toast.error('Failed to load students')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error fetching students')
        } finally {
            setLoading(false)
        }
    }

    const fetchReport = async (courseId: string) => {
        setReportLoading(true)
        try {
            const res = await fetch(`/api/admin/reports/course-progress?courseId=${courseId}`)
            if (res.ok) {
                const data = await res.json()
                setReportData(data.students)
            } else {
                toast.error('Failed to load report')
            }
        } catch (error) {
            console.error('Report error', error)
        } finally {
            setReportLoading(false)
        }
    }

    const toggleStatus = async (student: Student) => {
        // ... existing toggleStatus implementation ...
        if (!confirm(`Are you sure you want to ${student.is_banned ? 'activate' : 'deactivate'} this student?`)) return

        setProcessing(student.id)
        try {
            const action = student.is_banned ? 'activate' : 'deactivate'
            const res = await fetch('/api/admin/students/toggle-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: student.id, action })
            })

            if (res.ok) {
                toast.success(`Student ${action}d successfully`)
                fetchStudents() // Refresh list
                if (selectedCourseId) fetchReport(selectedCourseId) // Refresh report too
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to update status')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred')
        } finally {
            setProcessing(null)
        }
    }

    const handlePasswordReset = async () => {
        // ... existing implementation ...
        if (!resetModal || !newPassword) return
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setProcessing(resetModal.id)
        try {
            const res = await fetch('/api/admin/students/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: resetModal.id, newPassword })
            })

            if (res.ok) {
                toast.success('Password reset successfully')
                setResetModal(null)
                setNewPassword('')
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to reset password')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred')
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    // Filter report data based on tabs
    const filteredReport = reportData.filter(s => {
        if (reportTab === 'all') return true

        if (reportTab === 'completed') return s.status === 'completed'

        // For pending/watched, we only care about active students
        if (s.status === 'completed') return false

        if (reportTab === 'pending') return s.current_topic && !s.current_topic.is_completed
        if (reportTab === 'watched') return s.current_topic?.is_completed

        return true
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
                        <p className="text-gray-600 mt-2">View and manage student accounts</p>
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[200px]"
                        >
                            <option value="">All Courses (Select to Filter)</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                        <Link
                            href="/admin"
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>

                {selectedCourseId ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Tabs */}
                        <div className="border-b border-gray-200 bg-gray-50">
                            <nav className="-mb-px flex flex-wrap" aria-label="Tabs">
                                {[
                                    { id: 'all', name: 'All Enrolled' },
                                    { id: 'pending', name: 'Lesson Pending' },
                                    { id: 'watched', name: 'Lesson Watched' },
                                    { id: 'completed', name: 'Course Completed' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setReportTab(tab.id as any)}
                                        className={`${reportTab === tab.id
                                                ? 'border-blue-500 text-blue-600 bg-white'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } flex-1 min-w-[140px] py-4 px-4 text-center border-b-2 font-medium text-sm transition-colors`}
                                    >
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {reportLoading ? (
                            <div className="p-12 flex justify-center"><LoadingSpinner /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Active Lesson</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredReport.map((student: any) => (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                    <div className="text-sm text-gray-500">{student.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${student.progress_percent}%` }}></div>
                                                        </div>
                                                        <span className="text-sm text-gray-600">{student.progress_percent}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                    {student.status === 'completed' ? (
                                                        <span className="text-green-600 font-medium">Course Completed</span>
                                                    ) : (
                                                        student.current_topic?.title || '-'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {student.status === 'completed' ? (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            Certified
                                                        </span>
                                                    ) : (
                                                        student.current_topic?.title ? (
                                                            student.current_topic.is_completed ? (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    Watched
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                    Pending
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.last_active ? new Date(student.last_active).toLocaleDateString() : 'Never'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link
                                                        href={`/admin/students/${student.id}/progress`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredReport.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                    No students found in this category.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    // Default List View
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{student.email}</div>
                                                <div className="text-sm text-gray-500">{student.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(student.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {student.password || <span className="text-xs text-gray-400 italic">Hidden</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.is_banned
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {student.is_banned ? 'Inactive' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <Link
                                                    href={`/admin/students/${student.id}/progress`}
                                                    className="text-blue-600 hover:text-blue-900 mr-2"
                                                >
                                                    View Progress
                                                </Link>
                                                <button
                                                    onClick={() => setResetModal({ id: student.id, name: student.full_name })}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Reset Password"
                                                >
                                                    Reset Password
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(student)}
                                                    disabled={processing === student.id}
                                                    className={`${student.is_banned ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                                                        } ml-4`}
                                                >
                                                    {processing === student.id ? 'Processing...' : (student.is_banned ? 'Activate' : 'Deactivate')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                No students found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Password Reset Modal */}
            {resetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Reset Password</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter new password for <strong>{resetModal.name}</strong>
                        </p>
                        <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => { setResetModal(null); setNewPassword(''); }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordReset}
                                disabled={!!processing || !newPassword}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing === resetModal.id ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

