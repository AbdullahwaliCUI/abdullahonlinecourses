'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/utils/toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ScoreboardEntry {
    user_id: string
    total_marks: number
    total_possible: number
    profiles: {
        full_name: string
        email?: string
    }
}

interface Course {
    id: string
    title: string
}

export default function CourseScoreboardPage({ params }: { params: Promise<{ courseId: string }> }) {
    const router = useRouter()
    // React.use() to unwrap the params promise
    const { courseId } = use(params)

    const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([])
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [courseId])

    const fetchData = async () => {
        try {
            const supabase = createClient()

            // Fetch Course Details
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('id, title')
                .eq('id', courseId)
                .single()

            if (courseError) {
                console.error('Error fetching course:', courseError)
                toast.error('Course not found')
                router.push('/admin/scoreboard')
                return
            }
            setCourse(courseData)

            // Fetch Scoreboard Data
            const { data: scoreboardData, error: scoreboardError } = await supabase
                .from('course_scoreboard')
                .select(`
          *,
          profiles(full_name)
        `)
                .eq('course_id', courseId)
                .order('total_marks', { ascending: false })

            if (scoreboardError) throw scoreboardError
            setScoreboard(scoreboardData || [])

        } catch (error) {
            console.error('Error fetching scoreboard:', error)
            toast.error('Failed to load scoreboard')
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
                <div className="mb-8">
                    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                        <Link href="/admin/scoreboard" className="hover:text-blue-600">Scoreboard</Link>
                        <span>›</span>
                        <span className="text-gray-900">{course?.title}</span>
                    </nav>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
                            <p className="text-gray-600 mt-2">Student rankings and performance</p>
                        </div>
                        <Link
                            href="/admin/scoreboard"
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Back to Courses
                        </Link>
                    </div>
                </div>

                {/* Scoreboard Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Leaderboard</h2>
                    </div>

                    {scoreboard.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No students have taken tests in this course yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {scoreboard.map((entry, index) => {
                                        const percentage = entry.total_possible > 0
                                            ? Math.round((entry.total_marks / entry.total_possible) * 100)
                                            : 0

                                        let rankBadge = null
                                        if (index === 0) rankBadge = <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">1st 🏆</span>
                                        else if (index === 1) rankBadge = <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">2nd 🥈</span>
                                        else if (index === 2) rankBadge = <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold">3rd 🥉</span>
                                        else rankBadge = <span className="text-gray-500 font-medium">#{index + 1}</span>

                                        return (
                                            <tr key={entry.user_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {rankBadge}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                                            {entry.profiles?.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {entry.profiles?.full_name || 'Unknown Student'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-medium text-gray-900">{entry.total_marks}</div>
                                                    <div className="text-xs text-gray-500">out of {entry.total_possible}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className={`text-sm font-bold ${percentage >= 90 ? 'text-green-600' :
                                                            percentage >= 70 ? 'text-blue-600' :
                                                                percentage >= 50 ? 'text-yellow-600' :
                                                                    'text-red-600'
                                                        }`}>
                                                        {percentage}%
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
