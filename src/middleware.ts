import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user }, error } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Define public routes that don't require authentication
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/courses') ||
    pathname.startsWith('/request/') ||
    pathname === '/login' ||
    pathname.startsWith('/api/courses') ||
    pathname.startsWith('/api/requests') ||
    pathname.startsWith('/api/debug') ||
    pathname.startsWith('/student/course/')

  // Allow access to public routes
  if (isPublicRoute) {
    return supabaseResponse
  }

  // Admin API routes - handle authentication within the route
  if (pathname.startsWith('/api/admin/')) {
    return supabaseResponse
  }

  // For protected routes, check authentication
  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Admin routes protection: /admin*
  if (pathname.startsWith('/admin')) {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'instructor')) {
      // If logged in but not admin/instructor, redirect to student dashboard
      if (profile && profile.role === 'student') {
        const redirectUrl = new URL('/student', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      // If no profile or other issues, redirect to login
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Student routes protection: /student*
  if (pathname.startsWith('/student')) {
    if (!profile || profile.role !== 'student') {
      // If logged in but not student, redirect to login
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}