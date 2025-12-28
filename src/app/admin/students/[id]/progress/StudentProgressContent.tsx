'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { toast } from '@/lib/utils/toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import CertificateTemplate from '@/components/CertificateTemplate'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Topic {
    id: string
    title: string
    order_index: number
    is_unlocked: boolean
    is_completed: boolean
}

interface CourseProgress {
    course_id: string
    course_title: string
    topics: Topic[]
    enrollment_status: 'active' | 'completed' | 'revoked'
}

interface Student {
    id: string
    full_name: string
    phone: string
    email: string
}

export default function StudentProgressContent({ studentId }: { studentId: string }) {
    const [student, setStudent] = useState<Student | null>(null)
    const [progressData, setProgressData] = useState<CourseProgress[]>([])
    const [loading, setLoading] = useState(true)
    const [unlocking, setUnlocking] = useState<string | null>(null)
    const [issuing, setIssuing] = useState<string | null>(null)

    // Ref for certificate generation
    const certificateRef = useRef<HTMLDivElement>(null)
    const [certData, setCertData] = useState<{ studentName: string, courseName: string, date: string } | null>(null)

    useEffect(() => {
        fetchData()
    }, [studentId])

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/admin/students/${studentId}/progress`)
            if (!res.ok) throw new Error('Failed to fetch data')
            const data = await res.json()
            setStudent(data.student)
            setProgressData(data.courses)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load progress data')
        } finally {
            setLoading(false)
        }
    }

    const handleUnlock = async (courseId: string, topicId: string) => {
        if (!confirm('Are you sure you want to unlock this topic manually?')) return

        setUnlocking(topicId)
        try {
            const res = await fetch('/api/admin/progress/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: studentId, courseId, topicId })
            })

            if (res.ok) {
                toast.success('Topic unlocked')
                fetchData() // Refresh
            } else {
                toast.error('Failed to unlock topic')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred')
        } finally {
            setUnlocking(null)
        }
    }

    const handleIssueCertificate = async (courseId: string) => {
        if (!confirm('Issue certificate for this course? This will mark the course as Completed.')) return

        setIssuing(courseId)
        try {
            const res = await fetch('/api/admin/certificate/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: studentId, courseId })
            })

            if (res.ok) {
                toast.success('Certificate Issued')
                fetchData()
            } else {
                toast.error('Failed to issue certificate')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred')
        } finally {
            setIssuing(null)
        }
    }

    const handleDownloadCertificate = async (courseName: string) => {
        if (!student || !certificateRef.current) return

        // Prepare data for the hidden template
        setCertData({
            studentName: student.full_name,
            courseName: courseName,
            date: new Date().toLocaleDateString()
        })

        // Wait for render
        setTimeout(async () => {
            if (!certificateRef.current) return

            try {
                const canvas = await html2canvas(certificateRef.current, { scale: 2 })
                const imgData = canvas.toDataURL('image/png')
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                })

                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
                pdf.save(`${student.full_name.replace(/\s+/g, '_')}_Certificate.pdf`)
                toast.success('Certificate downloaded')
            } catch (error) {
                console.error('Error generating PDF:', error)
                toast.error('Failed to generate PDF')
            } finally {
                setCertData(null) // Hide or reset
            }
        }, 100)
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>

    if (!student) return <div className="p-8">Student not found</div>

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                {/* Header with Back Button and Student Info */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <Link href="/admin/students" className="text-gray-500 hover:text-gray-700">
                                ← Back to Students
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">{student.full_name}</h1>
                        </div>
                        <div className="flex items-center gap-4 text-gray-600">
                            <span>{student.email}</span>
                            <span>•</span>
                            <a
                                href={`https://wa.me/${student.phone?.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium px-3 py-1 bg-green-50 rounded-full border border-green-200 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-3.138-5.437-2.1-11.997 2.225-16.331 4.979-4.99 13.104-5.006 18.111-.035 4.957 4.921 4.981 12.87.054 17.833-4.305 4.336-10.863 5.418-16.31 2.333L.057 24zm4.275-6.521l.462.831c2.203 3.961 7.426 5.378 11.397 3.09 3.08-1.774 4.195-5.748 2.479-8.88-1.751-3.193-5.751-4.329-8.889-2.527C6.46 11.83 5.36 15.826 4.332 17.479zm12.337-8.157c-4.496-4.437-11.758-4.402-16.208.083-3.832 3.861-4.48 9.771-1.602 14.373L-.58 29.88l6.392-1.637c4.664 2.697 10.518 1.956 14.288-1.844 4.453-4.489 4.417-11.776-.039-16.234zM16.48 18.91c-.347-.174-2.053-1.013-2.37-1.13-.317-.116-.547-.174-.776.174-.229.348-.891 1.13-1.093 1.362-.202.232-.405.261-.752.087-1.791-.898-3.329-2.016-4.639-4.354-.175-.303.18-.396.657-1.353.076-.151.042-.294-.017-.417-.061-.122-.547-1.317-.749-1.804-.197-.473-.399-.408-.547-.416-.142-.007-.305-.007-.468-.007-.163 0-.429.061-.653.305-.224.244-.863.844-.863 2.059 0 1.215.885 2.389 1.008 2.563.123.174 3.486 5.304 8.423 7.433 3.3.931 3.511.907 4.79 0 .809-.575 2.053-.824 2.277-1.62.224-.797.224-1.48.163-1.583-.061-.103-.224-.174-.571-.348z" fillRule="evenodd" clipRule="evenodd" />
                                </svg>
                                {student.phone}
                            </a>
                        </div>
                    </div>
                </div>

                {progressData.map((course) => (
                    <div key={course.course_id} className="bg-white rounded-lg shadow overflow-hidden mb-8">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">{course.course_title}</h2>
                            <div className="flex gap-3">
                                {course.enrollment_status === 'completed' ? (
                                    <button
                                        onClick={() => handleDownloadCertificate(course.course_title)}
                                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Certificate
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleIssueCertificate(course.course_id)}
                                        disabled={issuing === course.course_id}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        {issuing === course.course_id ? 'Issuing...' : 'Issue Certificate'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {course.topics.map((topic) => (
                                    <tr key={topic.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {topic.order_index}. {topic.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${topic.is_completed
                                                ? 'bg-green-100 text-green-800'
                                                : topic.is_unlocked
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {topic.is_completed ? 'Completed' : topic.is_unlocked ? 'Unlocked' : 'Locked'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {!topic.is_unlocked && !topic.is_completed && (
                                                <button
                                                    onClick={() => handleUnlock(course.course_id, topic.id)}
                                                    disabled={!!unlocking}
                                                    className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md text-xs font-medium"
                                                >
                                                    {unlocking === topic.id ? 'Unlocking...' : 'Unlock Now'}
                                                </button>
                                            )}
                                            {topic.is_unlocked && !topic.is_completed && (
                                                <span className="text-gray-400 italic text-xs">Waiting for student</span>
                                            )}
                                            {topic.is_completed && (
                                                <span className="text-green-600 text-xs">✓ Done</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}

                {progressData.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                        Student is not enrolled in any courses yet.
                    </div>
                )}

            </div>

            {/* Hidden Certificate Template for Generation */}
            {certData && (
                <CertificateTemplate
                    ref={certificateRef}
                    studentName={certData.studentName}
                    courseName={certData.courseName}
                    date={certData.date}
                />
            )}
        </div>
    )
}
