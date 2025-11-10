import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: '/admin/:path*',
  runtime: 'nodejs', // Use Node.js runtime for database access
}

export async function middleware(request: NextRequest) {
  // Dynamically import to avoid Edge runtime issues
  const { verifyBasicAuth } = await import('./lib/auth')
  
  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const user = await verifyBasicAuth(request)
    
    if (!user) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access"',
        },
      })
    }
  }

  return NextResponse.next()
}

