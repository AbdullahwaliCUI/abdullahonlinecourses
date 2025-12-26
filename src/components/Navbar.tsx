import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
              LMS Platform
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/courses" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Courses
            </Link>
            <Link 
              href="/login" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/student" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Student
            </Link>
            <Link 
              href="/admin" 
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}