import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { verifyBasicAuth } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Allow login page without auth
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  
  if (pathname.includes('/admin/login')) {
    return <>{children}</>
  }

  // Check authentication for other admin pages
  const authHeader = headersList.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    redirect('/admin/login')
  }
  
  const request = new NextRequest('http://localhost/admin', {
    headers: { authorization: authHeader },
  })
  
  const user = await verifyBasicAuth(request)
  
  if (!user) {
    redirect('/admin/login')
  }

  return <>{children}</>
}

