import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Course {
  id: string
  title: string
}

interface TestAttempt {
  id: string
  test_id: string
  marks_obtained: number | null
  total_marks: number | null
  status: string
  graded_at: string | null
  completed_at: string
  tests: {
    id: string
    title: string
    topics: {
      title: string
      order_index: number
    }
  }
}

interface ScoreboardEntry {
  user_id: string
  total_marks: number
  total_possible: number
  profiles: {
    full_name: string
  }
}

async function getCourse(courseId: string): Promise<Course | null> {
  const supabase = await createClient()
  
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching course:', error)
    return null
  }

  return course as Course
}

async function getUserTestAttempts(userId: string, courseId: string): Promise<TestAttempt[]> {
  const supabase = await createClient()
  
  const { data: attempts, error } = await supabase
    .from('test_attempts')
    .select(`
      *,
      tests!inner(
        id,
        title,
        course_id,
        topics(title, order_index)
      )
    `)
    .eq('user_id', userId)
    .eq('tests.course_id', courseId)
    .order('completed_at', { ascending: false })

  if (error) {
    console.error('Error fetching test attempts:', error)
    return []
  }

  return attempts as TestAttempt[]
}

async function getCourseScoreboard(courseId: string): Promise<ScoreboardEntry[]> {
  const supabase = await createClient()
  
  const { data: scoreboard, error } = await supabase
    .from('course_scoreboard')
    .select(`
      *,
      profiles(full_name)
    `)
    .eq('course_id', courseId)
    .order('total_marks', { ascending: false })

  if (error) {
    console.error('Error fetching scoreboard:', error)
    return []
  }

  return scoreboard as ScoreboardEntry[]
}

async function checkEnrollment(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .single()

  return !error && !!enrollment
}

export default async function StudentScoreboardPage({ 
  params 
}: { 
  params: Promise<{ courseId: string }> 
}) {
  const { courseId } = await params
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    redirect('/login')
  }

  // Check if user is enrolled
  const isEnrolled = await checkEnrollment(user.id, courseId)
  if (!isEnrolled) {
    redirect('/student')
  }

  const [course, testAttempts, scoreboard] = await Promise.all([
    getCourse(courseId),
    getUserTestAttempts(user.id, courseId),
    getCourseScoreboard(courseId)
  ])

  if (!course) {
    redirect('/student')
  }

  // Calculate user's rank
  const userRank = scoreboard.findIndex(entry => entry.user_id === user.id) + 1
  const userScoreboardEntry = scoreboard.find(entry => entry.user_id === user.id)

  // Calculate user's total score
  const userTotalMarks = userScoreboardEntry?.total_marks || 0
  const userTotalPossible = userScoreboardEntry?.total_possible || 0
  const userPercentage = userTotalPossible > 0 ? Math.round((userTotalMarks / userTotalPossible) * 100) : 0

  // Calculate stats
  const totalTests = testAttempts.length
  const gradedTests = testAttempts.filter(attempt => attempt.status === 'graded').length
  const passedTests = testAttempts.filter(attempt => 
    attempt.status === 'graded' && 
    attempt.marks_obtained !== null && 
    attempt.total_marks !== null &&
    (attempt.marks_obtained / attempt.total_marks) >= 0.6
  ).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/student" className="hover:text-blue-600">My Courses</Link>
            <span>›</span>
            <Link href={`/student/course/${courseId}`} className="hover:text-blue-600">
              {course.title}
            </Link>
            <span>›</span>
            <span className="text-gray-900">Scoreboard</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Scoreboard</h1>
              <p className="text-gray-600">{course.title}</p>
            </div>
            <Link
              href={`/student/course/${courseId}`}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-medium"
            >
              Back to Course
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Performance */}
          <div className="lg:col-span-2">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{userRank || '-'}</p>
                <p className="text-sm text-gray-600">Class Rank</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{userPercentage}%</p>
                <p className="text-sm text-gray-600">Overall Score</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{gradedTests}</p>
                <p className="text-sm text-gray-600">Tests Graded</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{passedTests}</p>
                <p className="text-sm text-gray-600">Tests Passed</p>
              </div>
            </div>

            {/* My Test Results */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">My Test Results</h2>
              </div>
              
              {testAttempts.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Test Results</h3>
                  <p className="text-gray-600">You haven't taken any tests for this course yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Test
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Topic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {testAttempts.map((attempt) => {
                        const percentage = attempt.marks_obtained !== null && attempt.total_marks !== null
                          ? Math.round((attempt.marks_obtained / attempt.total_marks) * 100)
                          : null
                        const passed = percentage !== null && percentage >= 60

                        return (
                          <tr key={attempt.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {attempt.tests.title}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {attempt.tests.topics.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                Topic {attempt.tests.topics.order_index}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {attempt.status === 'graded' && attempt.marks_obtained !== null && attempt.total_marks !== null ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {attempt.marks_obtained}/{attempt.total_marks}
                                  </div>
                                  <div className={`text-sm ${passed ? 'text-green-600' : 'text-red-600'}`}>
                                    {percentage}%
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">Not graded</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                attempt.status === 'graded'
                                  ? passed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {attempt.status === 'graded' 
                                  ? passed ? 'Passed' : 'Failed'
                                  : 'Pending'
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(attempt.completed_at).toLocaleDateString()}
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

          {/* Class Rankings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Class Rankings</h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {scoreboard.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No rankings available yet.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {scoreboard.map((entry, index) => {
                      const percentage = entry.total_possible > 0 
                        ? Math.round((entry.total_marks / entry.total_possible) * 100)
                        : 0
                      const isCurrentUser = entry.user_id === user.id

                      return (
                        <div 
                          key={entry.user_id} 
                          className={`p-4 ${isCurrentUser ? 'bg-blue-50 border-blue-200' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                <span className="text-sm font-bold">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${
                                  isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {isCurrentUser ? 'You' : entry.profiles.full_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {entry.total_marks}/{entry.total_possible} points
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-semibold ${
                                isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {percentage}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}