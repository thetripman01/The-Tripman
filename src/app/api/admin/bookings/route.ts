import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const eventType = searchParams.get('eventType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build where clause
    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.startsAt = {} as Record<string, unknown>
      if (dateFrom) {
        (where.startsAt as Record<string, unknown>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        (where.startsAt as Record<string, unknown>).lte = new Date(dateTo + 'T23:59:59.999Z')
      }
    }

    if (eventType) {
      where.eventType = {
        slug: eventType,
      }
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        eventType: {
          select: {
            name: true,
            durationMin: true,
            priceCents: true,
          },
        },
      },
      orderBy: {
        startsAt: 'desc',
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
