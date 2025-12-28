'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
// ... (imports)
import { upsertCourse, upsertTopic, upsertVideo, deleteCourse, deleteTopic, deleteVideo } from '@/lib/actions/admin'

// ... (previous code)

const handleDeleteCourse = async (courseId: string) => {
  if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return

  setProcessing(true)
  try {
    const result = await deleteCourse(courseId)
    if (result.error) {
      toast.error('Failed to delete course', result.error)
    } else {
      toast.success('Course deleted')
      if (selectedCourse?.id === courseId) setSelectedCourse(null)
      fetchCourses()
    }
  } catch (error) {
    toast.error('Error', 'Failed to delete course')
  } finally {
    setProcessing(false)
  }
}

const handleDeleteTopic = async (topicId: string) => {
  if (!window.confirm('Are you sure you want to delete this topic?')) return

  setProcessing(true)
  try {
    const result = await deleteTopic(topicId)
    if (result.error) {
      toast.error('Failed to delete topic', result.error)
    } else {
      toast.success('Topic deleted')
      if (selectedTopic?.id === topicId) setSelectedTopic(null)
      if (selectedCourse) fetchTopics(selectedCourse.id)
    }
  } catch (error) {
    toast.error('Error', 'Failed to delete topic')
  } finally {
    setProcessing(false)
  }
}

const handleDeleteVideo = async (videoId: string) => {
  if (!window.confirm('Are you sure you want to delete this video?')) return

  setProcessing(true)
  try {
    const result = await deleteVideo(videoId)
    if (result.error) {
      toast.error('Failed to delete video', result.error)
    } else {
      toast.success('Video deleted')
      if (selectedTopic) fetchVideos(selectedTopic.id)
    }
  } catch (error) {
    toast.error('Error', 'Failed to delete video')
  } finally {
    setProcessing(false)
  }
}

// ... (render)

// Course Item Render
// ...
                    <div className="flex flex-col space-y-2 ml-2">
                        <button
                        onClick={(e) => {
                            e.stopPropagation()
                            openCourseModal('edit', course)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                        Edit
                        </button>
                        <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCourse(course.id)
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                        >
                        Delete
                        </button>
                    </div>
// ...

// Topic Item Render
// ...
                    <div className="flex flex-col space-y-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openTopicModal('edit', topic)
                        }}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTopic(topic.id)
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
// ...

// Video Item Render
// ...
                      <div className="flex flex-col space-y-2 ml-2">
                        <button
                            onClick={() => openVideoModal('edit', video)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            Delete
                        </button>
                      </div>
// ...

import { courseSchema, topicSchema, videoSchema } from '@/lib/utils/validators'
import { toast } from '@/lib/utils/toast'
import { LoadingButton } from '@/components/LoadingSpinner'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'

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

interface Video {
  id: string
  topic_id: string
  title: string
  youtube_url: string
  helper_material_url: string | null
  created_at: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [courseModal, setCourseModal] = useState<{ mode: 'create' | 'edit', course?: Course } | null>(null)
  const [topicModal, setTopicModal] = useState<{ mode: 'create' | 'edit', topic?: Topic } | null>(null)
  const [videoModal, setVideoModal] = useState<{ mode: 'create' | 'edit', video?: Video } | null>(null)

  // Form states
  const [courseForm, setCourseForm] = useState({ title: '', description: '', image_url: '' })
  const [topicForm, setTopicForm] = useState({ title: '', order_index: 1 })
  const [videoForm, setVideoForm] = useState({ title: '', youtube_url: '', helper_material_url: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchTopics(selectedCourse.id)
    }
  }, [selectedCourse])

  useEffect(() => {
    if (selectedTopic) {
      fetchVideos(selectedTopic.id)
    }
  }, [selectedTopic])

  const fetchCourses = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses', 'Please refresh the page to try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTopics = async (courseId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index')

      if (error) throw error
      setTopics(data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
      toast.error('Failed to load topics', 'Please try again.')
    }
  }

  const fetchVideos = async (topicId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at')

      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error('Error fetching videos:', error)
      toast.error('Failed to load videos', 'Please try again.')
    }
  }

  const handleCourseSubmit = async () => {
    setProcessing(true)
    setErrors({})

    try {
      // Validate form data
      const validatedData = courseSchema.parse({
        title: courseForm.title,
        description: courseForm.description,
        image_url: courseForm.image_url
      })

      const result = await upsertCourse({
        id: courseModal?.course?.id,
        ...validatedData
      })

      if (result.error) {
        toast.error('Failed to save course', result.error)
      } else {
        setCourseModal(null)
        fetchCourses()
        toast.success('Course saved successfully!', 'The course has been saved.')
      }
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
        toast.error('Validation errors', 'Please check the form and correct any errors.')
      } else {
        toast.error('Failed to save course', 'Please try again.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleTopicSubmit = async () => {
    if (!selectedCourse) return

    setProcessing(true)
    setErrors({})

    try {
      // Validate form data
      const validatedData = topicSchema.parse({
        title: topicForm.title,
        course_id: selectedCourse.id,
        order_index: topicForm.order_index
      })

      const result = await upsertTopic({
        id: topicModal?.topic?.id,
        ...validatedData
      })

      if (result.error) {
        toast.error('Failed to save topic', result.error)
      } else {
        setTopicModal(null)
        fetchTopics(selectedCourse.id)
        toast.success('Topic saved successfully!', 'The topic has been saved.')
      }
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
        toast.error('Validation errors', 'Please check the form and correct any errors.')
      } else {
        toast.error('Failed to save topic', 'Please try again.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleVideoSubmit = async () => {
    if (!selectedTopic) return

    setProcessing(true)
    setErrors({})

    try {
      // Validate form data
      const validatedData = videoSchema.parse({
        title: videoForm.title,
        youtube_url: videoForm.youtube_url,
        helper_material_url: videoForm.helper_material_url,
        topic_id: selectedTopic.id
      })

      const result = await upsertVideo({
        id: videoModal?.video?.id,
        ...validatedData
      })

      if (result.error) {
        toast.error('Failed to save video', result.error)
      } else {
        setVideoModal(null)
        fetchVideos(selectedTopic.id)
        toast.success('Video saved successfully!', 'The video has been saved.')
      }
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
        toast.error('Validation errors', 'Please check the form and correct any errors.')
      } else {
        toast.error('Failed to save video', 'Please try again.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return

    setProcessing(true)
    try {
      const result = await deleteCourse(courseId)
      if (result.error) {
        toast.error('Failed to delete course', result.error)
      } else {
        toast.success('Course deleted')
        if (selectedCourse?.id === courseId) setSelectedCourse(null)
        fetchCourses()
      }
    } catch (error) {
      toast.error('Error', 'Failed to delete course')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteTopic = async (topicId: string) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return

    setProcessing(true)
    try {
      const result = await deleteTopic(topicId)
      if (result.error) {
        toast.error('Failed to delete topic', result.error)
      } else {
        toast.success('Topic deleted')
        if (selectedTopic?.id === topicId) setSelectedTopic(null)
        if (selectedCourse) fetchTopics(selectedCourse.id)
      }
    } catch (error) {
      toast.error('Error', 'Failed to delete topic')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return

    setProcessing(true)
    try {
      const result = await deleteVideo(videoId)
      if (result.error) {
        toast.error('Failed to delete video', result.error)
      } else {
        toast.success('Video deleted')
        if (selectedTopic) fetchVideos(selectedTopic.id)
      }
    } catch (error) {
      toast.error('Error', 'Failed to delete video')
    } finally {
      setProcessing(false)
    }
  }

  const openCourseModal = (mode: 'create' | 'edit', course?: Course) => {
    setCourseModal({ mode, course })
    setCourseForm({
      title: course?.title || '',
      description: course?.description || '',
      image_url: course?.image_url || ''
    })
  }

  const openTopicModal = (mode: 'create' | 'edit', topic?: Topic) => {
    setTopicModal({ mode, topic })
    setTopicForm({
      title: topic?.title || '',
      order_index: topic?.order_index || (topics.length + 1)
    })
  }

  const openVideoModal = (mode: 'create' | 'edit', video?: Video) => {
    setVideoModal({ mode, video })
    setVideoForm({
      title: video?.title || '',
      youtube_url: video?.youtube_url || '',
      helper_material_url: video?.helper_material_url || ''
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
              <p className="text-gray-600 mt-2">Manage courses, topics, and video content</p>
            </div>
            <Link
              href="/admin"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Courses Panel */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Courses</h2>
              <button
                onClick={() => openCourseModal('create')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Add Course
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedCourse?.id === course.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                      )}
                      <div className="flex items-center mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {course.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openCourseModal('edit', course)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCourse(course.id)
                      }}
                      className="text-red-600 hover:text-red-800 text-sm ml-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topics Panel */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Topics {selectedCourse && `- ${selectedCourse.title}`}
              </h2>
              {selectedCourse && (
                <button
                  onClick={() => openTopicModal('create')}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Add Topic
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!selectedCourse ? (
                <div className="p-8 text-center text-gray-500">
                  Select a course to view topics
                </div>
              ) : topics.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No topics found. Add your first topic.
                </div>
              ) : (
                topics.map((topic) => (
                  <div
                    key={topic.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedTopic?.id === topic.id ? 'bg-green-50 border-green-200' : ''
                      }`}
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                            {topic.order_index}
                          </span>
                          <h3 className="font-medium text-gray-900">{topic.title}</h3>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openTopicModal('edit', topic)
                        }}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Videos Panel */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Videos {selectedTopic && `- ${selectedTopic.title}`}
              </h2>
              {selectedTopic && (
                <button
                  onClick={() => openVideoModal('create')}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                >
                  Add Video
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!selectedTopic ? (
                <div className="p-8 text-center text-gray-500">
                  Select a topic to view videos
                </div>
              ) : videos.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No videos found. Add your first video.
                </div>
              ) : (
                videos.map((video) => (
                  <div key={video.id} className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{video.title}</h3>
                        <a
                          href={video.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 mt-1 block"
                        >
                          View on YouTube →
                        </a>
                        {video.helper_material_url && (
                          <a
                            href={video.helper_material_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:text-green-800 mt-1 block"
                          >
                            Helper Material →
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => openVideoModal('edit', video)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Modal */}
      {courseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {courseModal.mode === 'create' ? 'Create Course' : 'Edit Course'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={courseForm.image_url}
                  onChange={(e) => {
                    let val = e.target.value
                    // Auto-convert YouTube URL to Thumbnail
                    const ytMatch = val.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
                    if (ytMatch && ytMatch[1]) {
                      val = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`
                      toast.success('YouTube Thumbnail Detected', 'Converted video link to thumbnail image.')
                    }
                    setCourseForm({ ...courseForm, image_url: val })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://... or Paste a YouTube Video Link"
                />
                <p className="text-xs text-gray-500 mt-1">Tip: Paste a YouTube video link to automatically get its thumbnail.</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCourseSubmit}
                disabled={processing || !courseForm.title}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Saving...' : 'Save Course'}
              </button>
              <button
                onClick={() => setCourseModal(null)}
                disabled={processing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {topicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {topicModal.mode === 'create' ? 'Create Topic' : 'Edit Topic'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Index *</label>
                <input
                  type="number"
                  value={topicForm.order_index}
                  onChange={(e) => setTopicForm({ ...topicForm, order_index: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleTopicSubmit}
                disabled={processing || !topicForm.title}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Saving...' : 'Save Topic'}
              </button>
              <button
                onClick={() => setTopicModal(null)}
                disabled={processing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {videoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {videoModal.mode === 'create' ? 'Create Video' : 'Edit Video'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
                <input
                  type="url"
                  value={videoForm.youtube_url}
                  onChange={(e) => setVideoForm({ ...videoForm, youtube_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Helper Material URL</label>
                <input
                  type="url"
                  value={videoForm.helper_material_url}
                  onChange={(e) => setVideoForm({ ...videoForm, helper_material_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleVideoSubmit}
                disabled={processing || !videoForm.title || !videoForm.youtube_url}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {processing ? 'Saving...' : 'Save Video'}
              </button>
              <button
                onClick={() => setVideoModal(null)}
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