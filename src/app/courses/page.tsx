import { createClient } from '@/lib/supabase/server'
import CourseCard from '@/components/CourseCard'
import { getVideoIdFromUrl, getThumbnailUrl } from '@/lib/utils/youtube'

interface Course {
  id: string
  title: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
}

interface Video {
  youtube_url: string
}

async function getCourses() {
  const supabase = await createClient()
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }

  return courses as Course[]
}

async function getCourseThumbnail(courseId: string) {
  const supabase = await createClient()
  
  // Get first video from first topic of the course
  const { data: video, error } = await supabase
    .from('videos')
    .select('youtube_url')
    .eq('topic_id', supabase
      .from('topics')
      .select('id')
      .eq('course_id', courseId)
      .order('order_index')
      .limit(1)
      .single()
      .then(res => res.data?.id)
    )
    .limit(1)
    .single()

  if (error || !video?.youtube_url) {
    return null
  }

  const videoId = getVideoIdFromUrl(video.youtube_url)
  return videoId ? getThumbnailUrl(videoId) : null
}

async function getCoursesWithThumbnails() {
  const courses = await getCourses()
  
  const coursesWithThumbnails = await Promise.all(
    courses.map(async (course) => {
      let thumbnailUrl = course.image_url
      
      // If no image_url, try to get thumbnail from first video
      if (!thumbnailUrl) {
        const supabase = await createClient()
        
        // Get first video from first topic
        const { data: firstTopic } = await supabase
          .from('topics')
          .select('id')
          .eq('course_id', course.id)
          .order('order_index')
          .limit(1)
          .single()

        if (firstTopic) {
          const { data: firstVideo } = await supabase
            .from('videos')
            .select('youtube_url')
            .eq('topic_id', firstTopic.id)
            .limit(1)
            .single()

          if (firstVideo?.youtube_url) {
            const videoId = getVideoIdFromUrl(firstVideo.youtube_url)
            if (videoId) {
              thumbnailUrl = getThumbnailUrl(videoId)
            }
          }
        }
      }
      
      return {
        ...course,
        thumbnailUrl
      }
    })
  )
  
  return coursesWithThumbnails
}

export default async function CoursesPage() {
  const courses = await getCoursesWithThumbnails()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Course Catalog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our comprehensive collection of courses designed to help you master new skills and advance your career.
          </p>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Available</h3>
            <p className="text-gray-600">
              We're working on adding new courses. Please check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description || undefined}
                imageUrl={course.thumbnailUrl || undefined}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Found a course you're interested in? Click on any course to learn more and see what topics are covered.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">
                💡 Tip: You can preview course content before enrolling to make sure it's the right fit for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}