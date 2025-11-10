import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { verifyBasicAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get headers to check authentication
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  
  // Create a request-like object for verifyBasicAuth
  const request = new NextRequest('http://localhost/admin', {
    headers: authHeader ? { authorization: authHeader } : {},
  })
  
  const user = await verifyBasicAuth(request)
  
  if (!user) {
    // Return 401 to trigger browser's Basic Auth dialog
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Access"',
      },
    })
  }

  return <>{children}</>
}

