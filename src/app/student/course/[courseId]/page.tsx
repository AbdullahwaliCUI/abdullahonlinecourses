import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { getVideoIdFromUrl, getThumbnailUrl } from '@/lib/utils/youtube'

interface Course {
  id: string
  title: string
  description: string | null
  image_url: string | null
}

interface Topic {
  id: string
  course_id: string
  title: string
  order_index: number
  created_at: string
}

interface Progress {
  id: string
  user_id: string
  course_id: string
  topic_id: string
  is_unlocked: boolean
  is_completed: boolean
  updated_at: string
}

interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: string
}

async function getCourse(courseId: string): Promise<Course | null> {
  const supabase = await createClient()
  
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching course:', error)
    return null
  }

  return course as Course
}

async function getTopics(courseId: string): Promise<Topic[]> {
  const supabase = await createClient()
  
  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index')

  if (error) {
    console.error('Error fetching topics:', error)
    return []
  }

  return topics as Topic[]
}

async function getUserProgress(userId: string, courseId: string): Promise<Progress[]> {
  const supabase = await createClient()
  
  const { data: progress, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)

  if (error) {
    console.error('Error fetching progress:', error)
    return []
  }

  return progress as Progress[]
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

async function getCourseThumbnail(courseId: string, imageUrl: string | null): Promise<string | null> {
  if (imageUrl) return imageUrl

  const supabase = await createClient()
  
  // Get first video from first topic
  const { data: firstTopic } = await supabase
    .from('topics')
    .select('id')
    .eq('course_id', courseId)
    .order('order_index')
    .limit(1)
    .single()

  if (!firstTopic) return null

  const { data: firstVideo } = await supabase
    .from('videos')
    .select('youtube_url')
    .eq('topic_id', firstTopic.id)
    .limit(1)
    .single()

  if (!firstVideo?.youtube_url) return null

  const videoId = getVideoIdFromUrl(firstVideo.youtube_url)
  return videoId ? getThumbnailUrl(videoId) : null
}

export default async function StudentCoursePage({ 
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

  const [course, topics, progress] = await Promise.all([
    getCourse(courseId),
    getTopics(courseId),
    getUserProgress(user.id, courseId)
  ])

  if (!course) {
    redirect('/student')
  }

  const thumbnailUrl = await getCourseThumbnail(courseId, course.image_url)

  // Create a map of topic progress for easy lookup
  const progressMap = new Map(progress.map(p => [p.topic_id, p]))

  // Calculate stats
  const totalTopics = topics.length
  const completedTopics = progress.filter(p => p.is_completed).length
  const unlockedTopics = progress.filter(p => p.is_unlocked).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Course Header */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              {thumbnailUrl && (
                <div className="relative h-64 w-full">
                  <Image
                    src={thumbnailUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                      {course.title}
                    </h1>
                    
                    {course.description && (
                      <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Total Topics</p>
                        <p className="text-2xl font-bold text-blue-900">{totalTopics}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Completed</p>
                        <p className="text-2xl font-bold text-green-900">{completedTopics}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-600">Unlocked</p>
                        <p className="text-2xl font-bold text-yellow-900">{unlockedTopics}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Course Progress</span>
                    <span>{totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Link
                    href={`/student/scoreboard/${courseId}`}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    View Scoreboard
                  </Link>
                  <Link
                    href="/student"
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Back to My Courses
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Topics */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Course Topics</h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {topics.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No topics available yet.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {topics.map((topic, index) => {
                      const topicProgress = progressMap.get(topic.id)
                      const isUnlocked = topicProgress?.is_unlocked || false
                      const isCompleted = topicProgress?.is_completed || false

                      return (
                        <div key={topic.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                                {isCompleted ? (
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                ) : isUnlocked ? (
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-blue-600">
                                      {index + 1}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-medium ${
                                  isUnlocked ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                  {topic.title}
                                </h3>
                                {isCompleted && (
                                  <p className="text-xs text-green-600 mt-1">Completed</p>
                                )}
                                {isUnlocked && !isCompleted && (
                                  <p className="text-xs text-blue-600 mt-1">Available</p>
                                )}
                                {!isUnlocked && (
                                  <p className="text-xs text-gray-400 mt-1">Locked</p>
                                )}
                              </div>
                            </div>

                            {isUnlocked && (
                              <Link
                                href={`/student/course/${courseId}/topic/${topic.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View →
                              </Link>
                            )}
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