'use client'

import React, { forwardRef } from 'react'

interface CertificateProps {
    studentName: string
    courseName: string
    date: string
    instructorName?: string
}

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateProps>(({
    studentName,
    courseName,
    date,
    instructorName = "Abdullah Wali"
}, ref) => {
    return (
        <div
            ref={ref}
            style={{
                width: '800px', // Fixed width for consistent PDF generation
                height: '600px',
                padding: '40px',
                backgroundColor: '#fff',
                backgroundImage: 'radial-gradient(circle at center, #fff 0%, #f0fdf4 100%)',
                border: '10px double #15803d', // Green border
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                fontFamily: "'Times New Roman', serif",
                color: '#1a2e05'
            }}
            className="certificate-container"
        >
            <div style={{
                border: '2px solid #166534',
                height: '100%',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }}>

                {/* Header */}
                <div style={{ marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: 0, color: '#15803d', textTransform: 'uppercase', letterSpacing: '4px' }}>
                        Certificate
                    </h1>
                    <h2 style={{ fontSize: '24px', fontWeight: 'normal', margin: '5px 0 0 0', color: '#166534' }}>
                        of Completion
                    </h2>
                </div>

                <p style={{ fontSize: '18px', margin: '20px 0' }}>This is to certify that</p>

                {/* Student Name */}
                <h3 style={{
                    fontSize: '42px',
                    fontWeight: 'bold',
                    margin: '10px 0',
                    borderBottom: '2px solid #15803d',
                    paddingBottom: '10px',
                    minWidth: '400px',
                    fontStyle: 'italic'
                }}>
                    {studentName}
                </h3>

                <p style={{ fontSize: '18px', margin: '20px 0' }}>has successfully completed the course</p>

                {/* Course Name */}
                <h4 style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0', color: '#15803d' }}>
                    {courseName}
                </h4>

                {/* Date and Signatures */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginTop: '80px',
                    padding: '0 40px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ borderTop: '1px solid #000', paddingTop: '10px', width: '200px', margin: '0 auto', fontSize: '16px' }}>
                            {date}
                        </p>
                        <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Date Issued</p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Cursive', fontSize: '24px', color: '#15803d', marginBottom: '5px' }}>
                            {instructorName}
                        </div>
                        <p style={{ borderTop: '1px solid #000', paddingTop: '10px', width: '200px', margin: '0 auto', fontSize: '16px' }}>
                            Instructor Signature
                        </p>
                    </div>
                </div>

                {/* Branding Footer */}
                <div style={{ position: 'absolute', bottom: '20px', fontSize: '12px', color: '#9ca3af' }}>
                    Abdullah Online Courses • Education Platform
                </div>

            </div>
        </div>
    )
})

CertificateTemplate.displayName = 'CertificateTemplate'

export default CertificateTemplate
