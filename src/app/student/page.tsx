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

interface Enrollment {
  id: string
  course_id: string
  status: string
  created_at: string
  courses: Course
}

async function getStudentEnrollments(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses(*)
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching enrollments:', error)
    return []
  }

  return data as Enrollment[]
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

export default async function StudentPage() {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    redirect('/login')
  }

  const enrollments = await getStudentEnrollments(user.id)

  // Get thumbnails for courses
  const enrollmentsWithThumbnails = await Promise.all(
    enrollments.map(async (enrollment) => {
      const thumbnailUrl = await getCourseThumbnail(
        enrollment.course_id,
        enrollment.courses.image_url
      )
      return {
        ...enrollment,
        thumbnailUrl
      }
    })
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Courses
          </h1>
          <p className="text-gray-600">
            Welcome back, {user.profile?.full_name || user.email}! Continue your learning journey.
          </p>
        </div>

        {enrollments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Enrolled Courses</h3>
            <p className="text-gray-600 mb-8">
              You haven't enrolled in any courses yet. Browse our course catalog to get started.
            </p>
            <Link
              href="/courses"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block font-medium"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enrollmentsWithThumbnails.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/student/course/${enrollment.course_id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {enrollment.thumbnailUrl && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={enrollment.thumbnailUrl}
                      alt={enrollment.courses.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${enrollment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {enrollment.status === 'completed' ? 'Completed' : 'Enrolled'}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {enrollment.courses.title}
                  </h3>

                  {enrollment.courses.description && (
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {enrollment.courses.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">
                      Enrolled {new Date(enrollment.created_at).toLocaleDateString()}
                    </span>

                    <span className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                      {enrollment.status === 'completed' ? 'Review Course' : 'Continue Learning'}
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {enrollments.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Courses</h3>
              <p className="text-3xl font-bold text-blue-600">{enrollments.length}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Topics Completed</h3>
              <p className="text-3xl font-bold text-green-600">-</p>
              <p className="text-sm text-gray-500 mt-1">Coming Soon</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Score</h3>
              <p className="text-3xl font-bold text-purple-600">-</p>
              <p className="text-sm text-gray-500 mt-1">Coming Soon</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}