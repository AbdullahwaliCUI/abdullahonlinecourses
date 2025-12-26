'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/actions/auth'
import { logout } from '@/lib/actions/auth'

interface User {
  id: string
  email?: string
  profile?: {
    role: 'student' | 'admin'
    full_name?: string
  }
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

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
            
            {loading ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                {user.profile?.role === 'student' && (
                  <Link 
                    href="/student" 
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                
                {user.profile?.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {user.profile?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-red-600 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}