import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { verifyBasicAuth } from '@/lib/auth'

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
    // Show error page - middleware already handles the Basic Auth dialog
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please provide valid admin credentials to access this page.</p>
          <p className="text-sm text-gray-500">If you see this message, please refresh the page and enter your credentials.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

