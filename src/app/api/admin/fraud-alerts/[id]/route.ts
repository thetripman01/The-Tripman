import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const updateFraudAlertSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult) {
      return authResult
    }

    const { id } = await params
    const body = await request.json()
    const { status } = updateFraudAlertSchema.parse(body)

    // Extract booking ID from fraud alert ID
    const bookingId = id.replace('fraud-', '')

    // Update the related booking based on fraud alert decision
    if (status === 'REJECTED') {
      // Cancel the booking if fraud is confirmed
      await db.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELED',
          notes: 'Booking cancelled due to fraud detection',
        },
      })
    } else if (status === 'APPROVED') {
      // Approve the booking if fraud check passes
      await db.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          notes: 'Booking approved after fraud review',
        },
      })
    }

    // In a real system, you would update the fraud alert status in the database
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: `Fraud alert ${status.toLowerCase()}`,
      bookingId,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid fraud alert data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating fraud alert:', error)
    return NextResponse.json(
      { error: 'Failed to update fraud alert' },
      { status: 500 }
    )
  }
}
