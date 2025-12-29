'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoadingButton } from '@/components/LoadingSpinner'

interface Profile {
    id: string
    email: string
    full_name: string
    role: string
    created_at: string
}

interface Course {
    id: string
    title: string
}

export default function InstructorsPage() {
    const [instructors, setInstructors] = useState<Profile[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newInstructorEmail, setNewInstructorEmail] = useState('')
    const [newInstructorName, setNewInstructorName] = useState('')
    const [selectedCourses, setSelectedCourses] = useState<string[]>([])
    const [processing, setProcessing] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch Instructors
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'instructor')

            if (profilesError) throw profilesError
            setInstructors(profiles || [])

            // Fetch Courses
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('id, title')

            if (coursesError) throw coursesError
            setCourses(coursesData || [])

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateInstructor = async () => {
        setProcessing(true)
        try {
            // 1. Check if user exists or create them (Note: Creating users usually requires Admin API or Invitation flow)
            // For this MVP, we will assume the Admin manually creates the user in Supabase Auth OR we use a simple "Invite" flow if implemented.
            // Since we don't have a backend "Invite User" API ready, we'll try to find an existing user or simulate.
            // ACTUALLY: The best way is to ask the Admin to "Enter the Email of an existing user" to promote them, 
            // OR use a backend API to create a user.

            // Let's implement: "Promote existing user by Email" for now, as creating new users client-side is restricted.
            // We will search for the user by email (if RLS allows admin to see emails).

            alert("Feature in progress: Please ensure the user has signed up first, then enter their email here to promote them.")

            // ... logic to update profile role ...

        } catch (error) {
            console.error('Error creating instructor:', error)
        } finally {
            setProcessing(false)
            setIsModalOpen(false)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Add Instructor
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Courses</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {instructors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        No instructors found.
                                    </td>
                                </tr>
                            ) : (
                                instructors.map((inst) => (
                                    <tr key={inst.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{inst.full_name}</div>
                                            <div className="text-sm text-gray-500">{inst.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {inst.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {/* TODO: Fetch and display assigned courses */}
                                            -
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
