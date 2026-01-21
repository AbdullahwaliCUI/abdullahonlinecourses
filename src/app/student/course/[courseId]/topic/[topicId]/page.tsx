'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { markTopicCompleted } from '@/lib/actions/progress'
import Link from 'next/link'

interface Topic {
  id: string
  course_id: string
  title: string
  order_index: number
}

interface Video {
  id: string
  topic_id: string
  title: string
  youtube_url: string | null
  admin_video_url: string | null
  helper_material_url: string | null
  document_url: string | null
  created_at: string
}

interface Course {
  id: string
  title: string
}

interface Progress {
  id: string
  is_unlocked: boolean
  is_completed: boolean
}

export default function StudentTopicPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const topicId = params.topicId as string

  const [topic, setTopic] = useState<Topic | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [courseId, topicId])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      // Fetch topic, course, videos, and progress in parallel
      const [topicRes, courseRes, videosRes, progressRes] = await Promise.all([
        supabase
          .from('topics')
          .select('*')
          .eq('id', topicId)
          .single(),
        supabase
          .from('courses')
          .select('id, title')
          .eq('id', courseId)
          .single(),
        supabase
          .from('videos')
          .select('*')
          .eq('topic_id', topicId)
          .order('created_at'),
        supabase
          .from('progress')
          .select('id, is_unlocked, is_completed')
          .eq('course_id', courseId)
          .eq('topic_id', topicId)
          .single()
      ])

      if (topicRes.error || !topicRes.data) {
        console.error('Topic not found:', topicRes.error)
        router.push(`/student/course/${courseId}`)
        return
      }

      if (courseRes.error || !courseRes.data) {
        console.error('Course not found:', courseRes.error)
        router.push('/student')
        return
      }

      // Check if topic is unlocked
      if (progressRes.error || !progressRes.data?.is_unlocked) {
        console.error('Topic not unlocked:', progressRes.error)
        router.push(`/student/course/${courseId}`)
        return
      }

      setTopic(topicRes.data)
      setCourse(courseRes.data)
      setVideos(videosRes.data || [])
      setProgress(progressRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push(`/student/course/${courseId}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkCompleted = async () => {
    if (!topic || progress?.is_completed) return

    setCompleting(true)
    try {
      // Get current user ID from auth
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('You must be logged in to mark topics as completed')
        return
      }

      const result = await markTopicCompleted(user.id, courseId, topicId)

      if (result.error) {
        alert(`Error: ${result.error}`)
      } else {
        setProgress(prev => prev ? { ...prev, is_completed: true } : null)
        alert('Topic marked as completed! 🎉')
      }
    } catch (error) {
      alert('Failed to mark topic as completed')
    } finally {
      setCompleting(false)
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = extractVideoId(url)
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading topic content...</p>
        </div>
      </div>
    )
  }

  if (!topic || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Topic Not Found</h1>
          <Link
            href={`/student/course/${courseId}`}
            className="text-blue-600 hover:underline"
          >
            Back to Course
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/student" className="hover:text-blue-600">My Courses</Link>
            <span>›</span>
            <Link href={`/student/course/${courseId}`} className="hover:text-blue-600">
              {course.title}
            </Link>
            <span>›</span>
            <span className="text-gray-900">{topic.title}</span>
          </nav>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mr-3">
                  Topic {topic.order_index}
                </span>
                {progress?.is_completed && (
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    ✓ Completed
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{topic.title}</h1>
            </div>

            <div className="ml-6 flex space-x-3">
              {!progress?.is_completed && (
                <button
                  onClick={handleMarkCompleted}
                  disabled={completing}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {completing ? 'Marking...' : 'Mark as Completed'}
                </button>
              )}
              <Link
                href={`/student/course/${courseId}`}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-medium"
              >
                Back to Course
              </Link>
            </div>
          </div>
        </div>

        {/* Videos */}
        {videos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Available</h3>
            <p className="text-gray-600">This topic doesn't have any video content yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {videos.map((video, index) => {
              const embedUrl = video.youtube_url ? getYouTubeEmbedUrl(video.youtube_url) || undefined : undefined

              return (
                <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {index + 1}. {video.title}
                      </h2>
                      <div className="flex space-x-3">
                        <a
                          href={video.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Watch on YouTube →
                        </a>
                        {video.helper_material_url && (
                          <a
                            href={video.helper_material_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Helper Material →
                          </a>
                        )}
                      </div>
                    </div>

                    {/* YouTube Embed */}
                    {video.youtube_url ? (
                      embedUrl ? (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={embedUrl}
                            title={video.title}
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div className="bg-gray-100 rounded-lg p-8 text-center">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-600">Unable to embed video. Please use the YouTube link above.</p>
                        </div>
                      )
                    ) : video.admin_video_url ? (
                      <div className="relative w-full">
                        {/* Simple check for video extensions, otherwise fallback to link */}
                        {/\.(mp4|webm|ogg)$/i.test(video.admin_video_url) ? (
                          <video
                            controls
                            className="w-full rounded-lg shadow-sm"
                            src={video.admin_video_url}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="bg-gray-100 rounded-lg p-8 text-center">
                            <p className="text-gray-600 mb-4">This video is hosted externally.</p>
                            <a
                              href={video.admin_video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              Watch Video
                            </a>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Document URL */}
                    {video.document_url && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Attached Document</h4>
                        <a
                          href={video.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Completion Section */}
        {!progress?.is_completed && videos.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-blue-900">Ready to Complete This Topic?</h3>
                <p className="text-blue-800 mt-1">
                  Once you've watched all the videos and reviewed the materials, mark this topic as completed to track your progress.
                </p>
              </div>
              <div className="ml-6">
                <button
                  onClick={handleMarkCompleted}
                  disabled={completing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {completing ? 'Marking Complete...' : 'Mark as Completed'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Completed Section */}
        {progress?.is_completed && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-green-900">Topic Completed! 🎉</h3>
                <p className="text-green-800 mt-1">
                  Great job! You've completed this topic. Continue with the next topic or review your progress.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}