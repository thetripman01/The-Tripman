'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { RideTracking } from '@/components/RideTracking'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  CreditCard, 
  AlertTriangle,
  X,
  CheckCircle,
  Navigation
} from 'lucide-react'

interface BookingDetails {
  id: string
  fullName: string
  email: string
  phone: string | null
  pickup: string | null
  peopleCount: number | null
  notes: string | null
  startsAt: string
  endsAt: string
  timezone: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED'
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  amountPaid: number | null
  paymentIntentId: string | null
  createdAt: string
  updatedAt: string
  eventType: {
    id: string
    name: string
    description: string | null
    durationMin: number
    priceCents: number | null
  }
  ride: {
    id: string
    driverName: string | null
    driverPhone: string | null
    vehicleInfo: string | null
    status: string
    startTime: string | null
    endTime: string | null
    locations: Array<{
      id: string
      latitude: number
      longitude: number
      address: string | null
      timestamp: string
      accuracy: number | null
      speed: number | null
      heading: number | null
    }>
  } | null
}

export default function BookingDetailsPage() {
  const params = useParams()
  const bookingId = params.id as string
  
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [refundRequested, setRefundRequested] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/booking/${bookingId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Booking not found')
            return
          }
          throw new Error('Failed to fetch booking')
        }

        const data = await response.json()
        setBooking(data)
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  const handleCancel = async () => {
    if (!booking) return

    setCancelling(true)
    try {
      const response = await fetch(`/api/booking/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason,
          refundRequested: refundRequested,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setBooking({ ...booking, status: 'CANCELED' })
        alert(result.message)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pending', color: 'bg-yellow-500' },
      CONFIRMED: { label: 'Confirmed', color: 'bg-green-500' },
      CANCELED: { label: 'Cancelled', color: 'bg-red-500' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Payment Pending', color: 'bg-yellow-500' },
      COMPLETED: { label: 'Paid', color: 'bg-green-500' },
      FAILED: { label: 'Payment Failed', color: 'bg-red-500' },
      REFUNDED: { label: 'Refunded', color: 'bg-blue-500' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    )
  }

  const canCancel = () => {
    if (!booking) return false
    if (booking.status === 'CANCELED') return false
    
    const now = new Date()
    const bookingStart = new Date(booking.startsAt)
    const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    return hoursUntilBooking >= 12 // Can cancel if more than 12 hours in advance
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600">{error || 'The booking you are looking for does not exist.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-600 mt-2">Booking ID: {booking.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{booking.eventType.name}</h3>
                    {booking.eventType.description && (
                      <p className="text-gray-600">{booking.eventType.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Date:</span>
                      <span>{formatDate(booking.startsAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Time:</span>
                      <span>{formatTime(booking.startsAt)} - {formatTime(booking.endsAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Duration:</span>
                      <span>{booking.eventType.durationMin} minutes</span>
                    </div>
                    
                    {booking.eventType.priceCents && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Price:</span>
                        <span>${(booking.eventType.priceCents / 100).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Name:</span>
                    <span>{booking.fullName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Email:</span>
                    <span>{booking.email}</span>
                  </div>
                  
                  {booking.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Phone:</span>
                      <span>{booking.phone}</span>
                    </div>
                  )}
                  
                  {booking.pickup && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Pickup:</span>
                      <span>{booking.pickup}</span>
                    </div>
                  )}
                  
                  {booking.peopleCount && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">People:</span>
                      <span>{booking.peopleCount}</span>
                    </div>
                  )}
                  
                  {booking.notes && (
                    <div>
                      <span className="font-medium">Notes:</span>
                      <p className="text-gray-600 mt-1">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Tracking */}
            {booking.ride && (
              <RideTracking bookingId={booking.id} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">Status:</span>
                  <div className="mt-1">{getStatusBadge(booking.status)}</div>
                </div>
                
                <div>
                  <span className="font-medium">Payment:</span>
                  <div className="mt-1">{getPaymentStatusBadge(booking.paymentStatus)}</div>
                </div>
                
                {booking.amountPaid && (
                  <div>
                    <span className="font-medium">Amount Paid:</span>
                    <span className="ml-2 font-semibold">${(booking.amountPaid / 100).toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {canCancel() && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <X className="w-4 h-4 mr-2" />
                        Cancel Booking
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Reason for cancellation (optional):
                          </label>
                          <Textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Please let us know why you're cancelling..."
                            rows={3}
                          />
                        </div>
                        
                        {booking.paymentStatus === 'COMPLETED' && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="refund"
                              checked={refundRequested}
                              onChange={(e) => setRefundRequested(e.target.checked)}
                            />
                            <label htmlFor="refund" className="text-sm">
                              Request refund (${(booking.amountPaid! / 100).toFixed(2)})
                            </label>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCancel}
                            disabled={cancelling}
                            variant="destructive"
                            className="flex-1"
                          >
                            {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                {!canCancel() && booking.status !== 'CANCELED' && (
                  <div className="text-sm text-gray-500 text-center">
                    <AlertTriangle className="w-4 h-4 mx-auto mb-2" />
                    <p>Bookings cannot be cancelled less than 12 hours before the scheduled time.</p>
                  </div>
                )}
                
                {booking.status === 'CANCELED' && (
                  <div className="text-sm text-gray-500 text-center">
                    <X className="w-4 h-4 mx-auto mb-2" />
                    <p>This booking has been cancelled.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>If you have any questions or need assistance, please contact us:</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href="tel:+1234567890" className="text-green-600 hover:underline">
                      +1 (555) 123-4567
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href="mailto:support@tripman.com" className="text-green-600 hover:underline">
                      support@tripman.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
