import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { verifyBasicAuth } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication for admin pages (login page is handled by middleware)
  const headersList = await headers()
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

