import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: '/admin/:path*',
}

export async function middleware(request: NextRequest) {
  // Allow login page
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next()
  }

  // For other admin pages, check for auth header
  // The layout will handle the actual verification and redirect
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    // Redirect to login instead of showing Basic Auth dialog
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

