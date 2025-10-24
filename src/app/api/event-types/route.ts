import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const eventTypes = await db.eventType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(eventTypes)
  } catch (error) {
    console.error('Error fetching event types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    )
  }
}
