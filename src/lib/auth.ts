import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from './db'

export async function verifyBasicAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null
  }

  const encoded = authHeader.substring(6)
  const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
  const [email, password] = decoded.split(':')

  if (!email || !password) {
    return null
  }

  try {
    const adminUser = await db.adminUser.findUnique({
      where: { email },
    })

    if (!adminUser) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, adminUser.password)
    
    if (!isValidPassword) {
      return null
    }

    return adminUser
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await verifyBasicAuth(request)
  
  if (!user) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Access"',
      },
    })
  }

  return null
}
