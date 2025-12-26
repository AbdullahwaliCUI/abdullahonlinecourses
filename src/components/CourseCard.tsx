import Link from 'next/link'
import Image from 'next/image'

interface CourseCardProps {
  id: string
  title: string
  description?: string
  imageUrl?: string
  className?: string
}

export default function CourseCard({ 
  id, 
  title, 
  description, 
  imageUrl, 
  className = '' 
}: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${className}`}>
        {imageUrl && (
          <div className="relative h-48 w-full">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
            {title}
          </h3>
          
          {description && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {description}
            </p>
          )}
          
          <div className="mt-4">
            <span className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              View Course
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}