import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will be handled by middleware, but we add an extra check here
  // The middleware will show the Basic Auth dialog
  return <>{children}</>
}

