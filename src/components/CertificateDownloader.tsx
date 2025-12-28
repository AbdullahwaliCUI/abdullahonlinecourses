'use client'

import { useState, useRef } from 'react'
import { toast } from '@/lib/utils/toast'
import CertificateTemplate from './CertificateTemplate'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Props {
    studentName: string
    courseName: string
    date: string
    className?: string
}

export default function CertificateDownloader({ studentName, courseName, date, className }: Props) {
    const certificateRef = useRef<HTMLDivElement>(null)
    const [generating, setGenerating] = useState(false)

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation if inside a Link
        e.stopPropagation()

        if (generating) return
        setGenerating(true)

        // Small delay to ensure render? actually the ref is always mounted but hidden
        // We don't need to conditionall render it if we hide it via CSS
        try {
            if (!certificateRef.current) return

            const canvas = await html2canvas(certificateRef.current, { scale: 2 })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            })

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
            pdf.save(`${studentName.replace(/\s+/g, '_')}_Certificate.pdf`)
            toast.success('Certificate downloaded')
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.error('Failed to generate PDF')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <>
            <button
                onClick={handleDownload}
                disabled={generating}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${className}`}
            >
                {generating ? 'Downloading...' : 'Download Certificate'}
            </button>

            {/* Hidden Certificate Template */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
                <CertificateTemplate
                    ref={certificateRef}
                    studentName={studentName}
                    courseName={courseName}
                    date={date}
                />
            </div>
        </>
    )
}
