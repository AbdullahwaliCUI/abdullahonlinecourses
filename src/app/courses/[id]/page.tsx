import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
import { getVideoIdFromUrl, getThumbnailUrl } from '@/lib/utils/youtube'
import { getVisibleTopicsForPublic, getUserEnrollmentStatus } from '@/lib/visibility'
import { getDirectImageUrl } from '@/lib/utils/image'

interface Course {
  id: string
  title: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
}

interface Topic {
  id: string
  course_id: string
  title: string
  order_index: number
  created_at: string
}

interface VisibilityData {
  topics: Topic[]
  visibleCount: number
  totalCount: number
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

async function getCourseTopics(courseId: string): Promise<VisibilityData> {
  return await getVisibleTopicsForPublic(courseId)
}

async function getUserEnrollment(courseId: string) {
  const user = await getUser()
  return await getUserEnrollmentStatus(user?.id || null, courseId)
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

export default async function CourseDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseId } = await params

  const [course, topicsData, enrollmentStatus] = await Promise.all([
    getCourse(courseId),
    getCourseTopics(courseId),
    getUserEnrollment(courseId)
  ])

  if (!course) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or is no longer available.</p>
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

  const thumbnailUrl = await getCourseThumbnail(courseId, course.image_url)
  const { isEnrolled, isActive } = enrollmentStatus
  const { topics, visibleCount, totalCount } = topicsData

  // Determine which topics to show
  const visibleTopics = isActive ? topics : topics.slice(0, visibleCount)
  const hiddenTopicsCount = totalCount - visibleTopics.length

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {thumbnailUrl && (
            <div className="relative h-64 w-full">
              <Image
                src={getDirectImageUrl(thumbnailUrl) || thumbnailUrl}
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

              {isActive && (
                <div className="ml-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Enrolled
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {totalCount} Topics
              </span>
              <span>•</span>
              <span>Created {new Date(course.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Topics List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">Course Topics</h2>
            {!isActive && hiddenTopicsCount > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Showing {visibleTopics.length} of {totalCount} topics.
                <span className="font-medium"> Enroll to see all content.</span>
              </p>
            )}
          </div>

          <div className="divide-y divide-gray-200">
            {visibleTopics.map((topic, index) => (
              <div key={topic.id} className="px-8 py-6 flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-sm font-medium text-blue-600">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {topic.title}
                  </h3>
                  {!isActive && (
                    <p className="text-sm text-gray-500 mt-1">
                      Preview only - Full content available after enrollment
                    </p>
                  )}
                </div>

                {isActive ? (
                  <Link
                    href={`/student/course/${courseId}/topic/${topic.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    Start Learning
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm">Locked</span>
                  </div>
                )}
              </div>
            ))}

            {/* Hidden Topics Indicator */}
            {!isActive && hiddenTopicsCount > 0 && (
              <div className="px-8 py-6 bg-gray-50 border-t-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-gray-600 font-medium">
                      {hiddenTopicsCount} more topics available after enrollment
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Unlock all course content including videos, materials, and assessments
                  </p>
                  <div className="flex justify-center space-x-2">
                    {Array.from({ length: Math.min(hiddenTopicsCount, 5) }).map((_, i) => (
                      <div key={i} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    ))}
                    {hiddenTopicsCount > 5 && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-500 font-medium">+{hiddenTopicsCount - 5}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enrollment CTA */}
        {!isActive && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-8 py-12 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Start Learning?
              </h3>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                Get full access to all {totalCount} topics, video content, and learning materials.
                Submit your payment and start your learning journey today.
              </p>

              <Link
                href={`/request/${courseId}`}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-block"
              >
                Request Enrollment & Submit Payment
              </Link>

              <div className="mt-6 text-sm text-blue-200">
                <p>Secure payment via JazzCash • Quick approval process</p>
              </div>
            </div>
          </div>
        )}

        {/* Enrolled Student CTA */}
        {isActive && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                🎉 You're enrolled in this course!
              </h3>
              <p className="text-green-700 mb-4">
                Access your course content and track your progress in the student portal.
              </p>
              <Link
                href={`/student/course/${courseId}`}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
              >
                Go to Student Portal
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}