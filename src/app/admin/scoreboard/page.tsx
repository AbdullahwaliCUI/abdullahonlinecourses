'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/utils/toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'

interface Course {
    id: string
    title: string
    description: string | null
    image_url: string | null
}

export default function ScoreboardCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('courses')
                .select('id, title, description, image_url')
                .eq('is_active', true)
                .order('title')

            if (error) throw error
            setCourses(data || [])
        } catch (error) {
            console.error('Error fetching courses:', error)
            toast.error('Failed to load courses')
        } finally {
            setLoading(false)
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
                        <h1 className="text-3xl font-bold text-gray-900">Scoreboard</h1>
                        <p className="text-gray-600 mt-2">Select a course to view student rankings and performance.</p>
                    </div>
                    <Link
                        href="/admin"
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/admin/scoreboard/${course.id}`}
                            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
                        >
                            <div className="h-40 bg-gray-200 relative">
                                {course.image_url ? (
                                    <img
                                        src={course.image_url}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-500">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {course.title}
                                </h3>
                                {course.description && (
                                    <p className="text-gray-600 text-sm line-clamp-2">
                                        {course.description}
                                    </p>
                                )}
                                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                                    View Leaderboard
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {courses.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No active courses found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
