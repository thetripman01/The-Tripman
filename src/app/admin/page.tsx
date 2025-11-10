'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Eye, CheckCircle, XCircle, Mail, Shield } from 'lucide-react'
import { FraudAlert } from '@/components/FraudAlert'

interface Booking {
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
  createdAt: string
  eventType: {
    name: string
    durationMin: number
    priceCents: number | null
  }
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    eventType: 'all',
    dateFrom: '',
    dateTo: '',
  })
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [activeTab, setActiveTab] = useState<'bookings' | 'fraud'>('bookings')

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.eventType && filters.eventType !== 'all') params.append('eventType', filters.eventType)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      // Get stored credentials from sessionStorage
      const auth = sessionStorage.getItem('adminAuth')
      const headers: HeadersInit = {}
      if (auth) {
        headers['Authorization'] = `Basic ${auth}`
      }

      const response = await fetch(`/api/admin/bookings?${params}`, {
        credentials: 'include',
        headers,
      })
      
      if (response.status === 401) {
        // Not authenticated - redirect to login
        sessionStorage.removeItem('adminAuth')
        window.location.href = '/admin/login'
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      } else {
        console.error('Failed to fetch bookings:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.eventType, filters.dateFrom, filters.dateTo])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const auth = sessionStorage.getItem('adminAuth')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (auth) {
        headers['Authorization'] = `Basic ${auth}`
      }

      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      if (response.status === 401) {
        sessionStorage.removeItem('adminAuth')
        window.location.href = '/admin/login'
        return
      }

      if (response.ok) {
        fetchBookings()
        setSelectedBooking(null)
      }
    } catch (error) {
      console.error('Failed to update booking status:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'CANCELED':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage bookings and view analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('fraud')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'fraud'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Fraud Detection
              </button>
            </nav>
          </div>
        </div>

        {/* Fraud Detection Tab */}
        {activeTab === 'fraud' && (
          <div className="mb-6">
            <FraudAlert />
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <>
            {/* Filters */}
            <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELED">Canceled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.eventType} onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Event Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types</SelectItem>
                  <SelectItem value="birthday-uber-ride">Birthday Uber Ride</SelectItem>
                  <SelectItem value="airport-pickup">Airport Pick-Up</SelectItem>
                  <SelectItem value="city-night-tour">City Night Tour</SelectItem>
                  <SelectItem value="surprise-date-ride">Surprise Date Ride</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From Date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />

              <Input
                type="date"
                placeholder="To Date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.eventType.name}</h3>
                      <p className="text-gray-600">{booking.fullName}</p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {booking.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'CANCELED')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(booking.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(booking.startsAt)} - {formatTime(booking.endsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{booking.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {bookings.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No bookings found matching your filters.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Booking Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBooking(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold">Event Type</label>
                    <p>{selectedBooking.eventType.name}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <label className="font-semibold">Customer Name</label>
                    <p>{selectedBooking.fullName}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Email</label>
                    <p>{selectedBooking.email}</p>
                  </div>
                  {selectedBooking.phone && (
                    <div>
                      <label className="font-semibold">Phone</label>
                      <p>{selectedBooking.phone}</p>
                    </div>
                  )}
                  {selectedBooking.peopleCount && (
                    <div>
                      <label className="font-semibold">Number of People</label>
                      <p>{selectedBooking.peopleCount}</p>
                    </div>
                  )}
                  {selectedBooking.pickup && (
                    <div className="col-span-2">
                      <label className="font-semibold">Pickup Location</label>
                      <p>{selectedBooking.pickup}</p>
                    </div>
                  )}
                  {selectedBooking.notes && (
                    <div className="col-span-2">
                      <label className="font-semibold">Notes</label>
                      <p>{selectedBooking.notes}</p>
                    </div>
                  )}
                  <div>
                    <label className="font-semibold">Date</label>
                    <p>{formatDate(selectedBooking.startsAt)}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Time</label>
                    <p>{formatTime(selectedBooking.startsAt)} - {formatTime(selectedBooking.endsAt)}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Duration</label>
                    <p>{selectedBooking.eventType.durationMin} minutes</p>
                  </div>
                  {selectedBooking.eventType.priceCents && (
                    <div>
                      <label className="font-semibold">Price</label>
                      <p>${(selectedBooking.eventType.priceCents / 100).toFixed(2)}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedBooking.status === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'CONFIRMED')}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Booking
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => updateBookingStatus(selectedBooking.id, 'CANCELED')}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Booking
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBooking(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
