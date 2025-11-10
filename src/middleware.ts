import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: '/admin/:path*',
}

export async function middleware(request: NextRequest) {
  // Check if Basic Auth header is present
  // The actual verification happens in the layout (server component)
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Access"',
      },
    })
  }

  return NextResponse.next()
}

