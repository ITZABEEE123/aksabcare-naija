import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🔐 ENHANCED SECURITY MIDDLEWARE FOR AKSABHEALTH NG
// ===================================================
// This middleware runs on EVERY request to implement strict security measures

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl
  
  // Debug logging
  console.log('🛠️ Middleware Debug:', {
    pathname,
    sessionExists: !!session,
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      doctorId: session.user.doctorId,
      patientId: session.user.patientId
    } : null
  })
  
  const isLoggedIn = !!session?.user
  const userRole = session?.user?.role
  
  console.log(`🛡️ Middleware: ${pathname} | LoggedIn: ${isLoggedIn} | Role: ${userRole}`)
  
  // 🚨 CRITICAL SECURITY ROUTES
  // ============================
  
  // 🏥 DOCTOR ROUTES - Only accessible by verified doctors
  if (pathname.startsWith('/doctor')) {
    if (!isLoggedIn) {
      console.log('❌ Unauthorized: No session for doctor route')
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
    
    if (userRole !== 'DOCTOR') {
      console.log(`❌ Forbidden: Role ${userRole} cannot access doctor routes`)
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
    
    console.log('✅ Authorized: Doctor access granted')
    return NextResponse.next()
  }
  
  // 🏥 PATIENT ROUTES - Only accessible by verified patients
  if (pathname.startsWith('/patient')) {
    if (!isLoggedIn) {
      console.log('❌ Unauthorized: No session for patient route')
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
    
    if (userRole !== 'PATIENT') {
      console.log(`❌ Forbidden: Role ${userRole} cannot access patient routes`)
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
    
    console.log('✅ Authorized: Patient access granted')
    return NextResponse.next()
  }
  
  // 🛡️ ADMIN ROUTES - Only accessible by admins
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn || userRole !== 'SUPER_ADMIN') {
      console.log(`❌ Forbidden: Role ${userRole} cannot access admin routes`)
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
    
    console.log('✅ Authorized: Admin access granted')
    return NextResponse.next()
  }
  
  // 🔄 ROLE-BASED DASHBOARD REDIRECTS
  // ==================================
  if (pathname === '/dashboard' && isLoggedIn) {
    switch (userRole) {
      case 'DOCTOR':
        console.log('🔄 Redirecting doctor to /doctor')
        return NextResponse.redirect(new URL('/doctor', request.url))
      case 'PATIENT':
        console.log('🔄 Redirecting patient to /patient')
        return NextResponse.redirect(new URL('/patient', request.url))
      case 'SUPER_ADMIN':
        console.log('🔄 Redirecting admin to /admin')
        return NextResponse.redirect(new URL('/admin', request.url))
      default:
        console.log(`⚠️ Unknown role: ${userRole}, redirecting to login`)
        return NextResponse.redirect(new URL('/login?error=invalid_role', request.url))
    }
  }
  
  // 🚪 AUTH ROUTES - Allow access to login/register even if logged in
  // Users might want to switch accounts or register new accounts
  if (pathname === '/login' || pathname === '/register') {
    console.log(`� Allowing access to ${pathname} page`)
    return NextResponse.next()
  }
  
  // 🏠 ROOT PATH - Allow everyone to view the main page
  // Users can choose to sign in from the main page
  if (pathname === '/') {
    console.log('🏠 Allowing access to main page')
    return NextResponse.next()
  }
  
  // 🌐 PUBLIC ROUTES - Allow access to public pages regardless of login status
  const publicRoutes = ['/about', '/contact', '/services', '/privacy', '/terms']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    console.log(`🌐 Allowing access to public route: ${pathname}`)
    return NextResponse.next()
  }
  
  // 🔍 DEBUG: Log any unhandled routes
  console.log(`🔍 Unhandled route: ${pathname} | Role: ${userRole} | Allowing to continue`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}