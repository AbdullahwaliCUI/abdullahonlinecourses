'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createTest, deleteTest } from '@/lib/actions/admin'
import { toast } from '@/lib/utils/toast'
import { LoadingButton } from '@/components/LoadingSpinner'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'

interface Course {
    id: string
    title: string
}

interface Topic {
    id: string
    course_id: string
    title: string
    order_index: number
}

interface Test {
    id: string
    course_id: string
    topic_id: string
    title: string
    scheduled_at: string | null
    course?: { title: string }
    topic?: { title: string }
}

export default function AdminTestsPage() {
    const [tests, setTests] = useState<Test[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [topics, setTopics] = useState<Topic[]>([])
    const [loading, setLoading] = useState(true)

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Form states
    const [testForm, setTestForm] = useState({
        title: '',
        course_id: '',
        topic_id: '',
        scheduled_at: ''
    })

    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    // Fetch topics when course is selected
    useEffect(() => {
        if (testForm.course_id) {
            fetchTopics(testForm.course_id)
        } else {
            setTopics([])
        }
    }, [testForm.course_id])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const supabase = createClient()

            // Fetch tests with relations
            const { data: testsData, error: testsError } = await supabase
                .from('tests')
                .select(`
          *,
          course:courses(title),
          topic:topics(title)
        `)
                .order('created_at', { ascending: false })

            if (testsError) throw testsError
            setTests(testsData || [])

            // Fetch courses for dropdown
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('id, title')
                .eq('is_active', true)
                .order('title')

            if (coursesError) throw coursesError
            setCourses(coursesData || [])

        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load data', 'Please refresh the page.')
        } finally {
            setLoading(false)
        }
    }

    const fetchTopics = async (courseId: string) => {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('topics')
                .select('id, course_id, title, order_index')
                .eq('course_id', courseId)
                .order('order_index')

            if (error) throw error
            setTopics(data || [])
        } catch (error) {
            console.error('Error fetching topics:', error)
            toast.error('Failed to load topics')
        }
    }

    const handleCreateSubmit = async () => {
        setProcessing(true)
        try {
            if (!testForm.course_id || !testForm.topic_id || !testForm.title) {
                toast.error('Missing fields', 'Please fill in all required fields.')
                setProcessing(false)
                return
            }

            const result = await createTest({
                course_id: testForm.course_id,
                topic_id: testForm.topic_id,
                title: testForm.title,
                scheduled_at: testForm.scheduled_at || undefined
            })

            if (result.error) {
                toast.error('Failed to create test', result.error)
            } else {
                toast.success('Test created successfully!')
                setIsCreateModalOpen(false)
                setTestForm({ title: '', course_id: '', topic_id: '', scheduled_at: '' })
                fetchInitialData()
            }
        } catch (error) {
            console.error('Error creating test:', error)
            toast.error('Error', 'An unexpected error occurred.')
        } finally {
            setProcessing(false)
        }
    }

    const handleDeleteTest = async (testId: string) => {
        if (!window.confirm('Are you sure you want to delete this test? All student attempts and grades will be lost.')) return

        setProcessing(true)
        try {
            const result = await deleteTest(testId)
            if (result.error) {
                toast.error('Failed to delete test', result.error)
            } else {
                toast.success('Test deleted successfully')
                fetchInitialData()
            }
        } catch (error) {
            console.error('Error deleting test:', error)
            toast.error('Error', 'Failed to delete test')
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tests & Grading</h1>
                        <p className="text-gray-600 mt-2">Manage course assessments and viewing student grades.</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create New Test
                        </button>
                        <Link
                            href="/admin"
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>

                {/* Tests List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">All Tests</h2>
                    </div>

                    {tests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No tests found. Create your first test to get started.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled At</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tests.map((test) => (
                                        <tr key={test.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{test.title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{test.course?.title || 'Unknown Course'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{test.topic?.title || 'Unknown Topic'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {test.scheduled_at
                                                        ? new Date(test.scheduled_at).toLocaleDateString() + ' ' + new Date(test.scheduled_at).toLocaleTimeString()
                                                        : 'On Demand'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDeleteTest(test.id)}
                                                    className="text-red-600 hover:text-red-900 ml-4"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Test Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Create New Test</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                                <select
                                    value={testForm.course_id}
                                    onChange={(e) => setTestForm({ ...testForm, course_id: e.target.value, topic_id: '' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a Course</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                                <select
                                    value={testForm.topic_id}
                                    onChange={(e) => setTestForm({ ...testForm, topic_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={!testForm.course_id}
                                >
                                    <option value="">Select a Topic</option>
                                    {topics.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Test Title *</label>
                                <input
                                    type="text"
                                    value={testForm.title}
                                    onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Mid-term Exam"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={testForm.scheduled_at}
                                    onChange={(e) => setTestForm({ ...testForm, scheduled_at: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <LoadingButton
                                onClick={handleCreateSubmit}
                                loading={processing}
                                disabled={!testForm.course_id || !testForm.topic_id || !testForm.title}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                Create Test
                            </LoadingButton>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                disabled={processing}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
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
