'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoadingButton } from '@/components/LoadingSpinner'
import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from '@/lib/utils/toast'
import { createInstructorUser } from '@/lib/actions/admin'

interface Instructor {
    id: string
    email: string
    full_name: string
    role: string
    course_instructors?: {
        course_id: string
        courses: {
            title: string
        }
    }[]
}

interface Course {
    id: string
    title: string
}

export default function InstructorsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [addMode, setAddMode] = useState<'create' | 'promote'>('create')

    // Form States
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })
    const [promotePhone, setPromotePhone] = useState('')

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
    const [selectedCourseId, setSelectedCourseId] = useState('')

    const [processing, setProcessing] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select(`
          *,
          course_instructors (
            course_id,
            courses (
              title
            )
          )
        `)
                .eq('role', 'instructor')

            if (profilesError) throw profilesError
            setInstructors(profiles || [])

            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('id, title')
                .eq('is_active', true)

            if (coursesError) throw coursesError
            setCourses(coursesData || [])

        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load instructors')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateNewInstructor = async () => {
        // Validation
        if (!formData.fullName || !formData.phone || !formData.email || !formData.password) {
            toast.error('All fields are required')
            return
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setProcessing(true)
        try {
            const result = await createInstructorUser({
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                password: formData.password
            })

            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success('Instructor account created successfully!')
            setIsAddModalOpen(false)
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: ''
            })
            fetchData()

        } catch (error) {
            console.error('Creation error:', error)
            toast.error('Failed to create account')
        } finally {
            setProcessing(false)
        }
    }

    const handlePromoteUser = async () => {
        if (!promotePhone) return
        setProcessing(true)
        try {
            const { data: foundUsers, error: searchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('phone', promotePhone)
                .single()

            if (searchError || !foundUsers) {
                toast.error('User not found with this phone number')
                return
            }

            if (foundUsers.role === 'admin') {
                toast.error('User is already an Admin')
                return
            }

            if (foundUsers.role === 'instructor') {
                toast.error('User is already an Instructor')
                return
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'instructor' })
                .eq('id', foundUsers.id)

            if (updateError) throw updateError

            toast.success('User promoted to Instructor')
            setIsAddModalOpen(false)
            setPromotePhone('')
            fetchData()

        } catch (error) {
            console.error('Error promoting user:', error)
            toast.error('Failed to promote user')
        } finally {
            setProcessing(false)
        }
    }

    const handleAssignCourse = async () => {
        if (!selectedInstructor || !selectedCourseId) return
        setProcessing(true)
        try {
            const { error } = await supabase
                .from('course_instructors')
                .insert({
                    course_id: selectedCourseId,
                    instructor_id: selectedInstructor.id
                })

            if (error) throw error

            toast.success('Course assigned successfully')
            setIsAssignModalOpen(false)
            fetchData()
        } catch (error: any) {
            if (error.code === '23505') { // Unique violation
                toast.error('Instructor is already assigned to this course')
            } else {
                console.error('Error assigning course:', error)
                toast.error('Failed to assign course')
            }
        } finally {
            setProcessing(false)
        }
    }

    const handleRemoveCourse = async (instructorId: string, courseId: string) => {
        if (!confirm('Are you sure you want to remove this course assignment?')) return
        try {
            const { error } = await supabase
                .from('course_instructors')
                .delete()
                .match({ instructor_id: instructorId, course_id: courseId })

            if (error) throw error
            toast.success('Assignment removed')
            fetchData()
        } catch (error) {
            console.error('Error removing course:', error)
            toast.error('Failed to remove course')
        }
    }

    const openAssignModal = (inst: Instructor) => {
        setSelectedInstructor(inst)
        setSelectedCourseId('')
        setIsAssignModalOpen(true)
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
                        <p className="text-gray-600 mt-1">Manage course instructors and their assignments</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Instructor
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Courses</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {instructors.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                            </svg>
                                            <p className="text-lg font-medium text-gray-900">No Instructors Found</p>
                                            <p className="text-gray-500">Create a new instructor account or promote an existing user.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                instructors.map((inst) => (
                                    <tr key={inst.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-bold text-lg">
                                                        {inst.full_name?.charAt(0) || '?'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{inst.full_name}</div>
                                                    <div className="text-sm text-gray-500">{inst.email || 'No Email'}</div>
                                                    <div className="text-xs text-gray-400 mt-1">ID: {inst.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {inst.course_instructors && inst.course_instructors.length > 0 ? (
                                                    inst.course_instructors.map((ci) => (
                                                        <span
                                                            key={ci.course_id}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                        >
                                                            {ci.courses.title}
                                                            <button
                                                                onClick={() => handleRemoveCourse(inst.id, ci.course_id)}
                                                                className="ml-1.5 h-4 w-4 inline-flex items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                                                            >
                                                                &times;
                                                            </button>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No courses assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openAssignModal(inst)}
                                                className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded text-xs transition-colors"
                                            >
                                                Assign Course
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Instructor Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Add Instructor</h3>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                className={`py-2 px-4 text-sm font-medium ${addMode === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setAddMode('create')}
                            >
                                Create New
                            </button>
                            <button
                                className={`py-2 px-4 text-sm font-medium ${addMode === 'promote' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setAddMode('promote')}
                            >
                                Promote Existing
                            </button>
                        </div>

                        {addMode === 'create' ? (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 mb-2">Create a new user account with Instructor privileges.</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>

                                <div className="flex space-x-3 mt-6">
                                    <LoadingButton
                                        onClick={handleCreateNewInstructor}
                                        loading={processing}
                                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                                    >
                                        Create Instructor
                                    </LoadingButton>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        disabled={processing}
                                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Enter the <strong>Phone Number</strong> of an existing student to promote them.
                                </p>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={promotePhone}
                                        onChange={(e) => setPromotePhone(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. +923001234567"
                                    />
                                </div>

                                <div className="flex space-x-3 mt-6">
                                    <LoadingButton
                                        onClick={handlePromoteUser}
                                        loading={processing}
                                        disabled={!promotePhone}
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Find & Promote
                                    </LoadingButton>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        disabled={processing}
                                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Assign Course Modal */}
            {isAssignModalOpen && selectedInstructor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-2">Assign Course</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Assign a course to <strong>{selectedInstructor.full_name}</strong>. They will be able to manage students and content for this course.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                            <select
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Select a course --</option>
                                {courses
                                    .filter(c => !selectedInstructor.course_instructors?.some(ci => ci.course_id === c.id))
                                    .map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <LoadingButton
                                onClick={handleAssignCourse}
                                loading={processing}
                                disabled={!selectedCourseId}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                Assign
                            </LoadingButton>
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
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
