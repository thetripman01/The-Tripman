import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding production database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10)
  
  const adminUser = await prisma.adminUser.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@tripman.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@tripman.com',
      password: hashedPassword,
    },
  })

  console.log('✅ Admin user created:', adminUser.email)

  // Create event types (services)
  const eventTypes = [
    {
      slug: 'airport-transfer',
      name: 'Airport Transfer',
      description: 'Professional airport transportation service with luxury vehicles. Perfect for business travelers and families.',
      durationMin: 60,
      priceCents: 5000, // $50.00
      isActive: true,
    },
    {
      slug: 'city-tour',
      name: 'City Tour',
      description: 'Guided city tour with professional driver. Explore the city\'s landmarks and attractions.',
      durationMin: 180, // 3 hours
      priceCents: 12000, // $120.00
      isActive: true,
    },
    {
      slug: 'wedding-transport',
      name: 'Wedding Transport',
      description: 'Luxury wedding transportation service. Make your special day even more memorable.',
      durationMin: 120, // 2 hours
      priceCents: 8000, // $80.00
      isActive: true,
    },
    {
      slug: 'corporate-transport',
      name: 'Corporate Transport',
      description: 'Business transportation for executives. Professional, reliable, and punctual.',
      durationMin: 90, // 1.5 hours
      priceCents: 6000, // $60.00
      isActive: true,
    },
    {
      slug: 'hourly-charter',
      name: 'Hourly Charter',
      description: 'Flexible hourly charter service. Perfect for events, meetings, or special occasions.',
      durationMin: 60, // 1 hour minimum
      priceCents: 4000, // $40.00 per hour
      isActive: true,
    },
    {
      slug: 'night-out',
      name: 'Night Out',
      description: 'Safe and reliable transportation for your night out. Available until late hours.',
      durationMin: 120, // 2 hours
      priceCents: 7000, // $70.00
      isActive: true,
    },
  ]

  for (const eventType of eventTypes) {
    const created = await prisma.eventType.upsert({
      where: { slug: eventType.slug },
      update: eventType,
      create: eventType,
    })
    console.log(`✅ Event type created: ${created.name}`)
  }

  // Create sample bookings for testing (optional)
  if (process.env.NODE_ENV === 'development') {
    const sampleBookings = [
      {
        eventTypeSlug: 'airport-transfer',
        fullName: 'John Smith',
        email: 'john@example.com',
        phone: '+1-555-0123',
        pickup: 'Toronto Pearson Airport',
        peopleCount: 2,
        notes: 'Please wait at Terminal 1, Arrivals',
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
        timezone: 'America/Toronto',
        status: 'CONFIRMED' as const,
        paymentStatus: 'COMPLETED' as const,
        amountPaid: 5000,
      },
      {
        eventTypeSlug: 'city-tour',
        fullName: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1-555-0456',
        pickup: 'Downtown Hotel',
        peopleCount: 4,
        notes: 'Family with children, need car seats',
        startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Day after tomorrow + 3 hours
        timezone: 'America/Toronto',
        status: 'CONFIRMED' as const,
        paymentStatus: 'COMPLETED' as const,
        amountPaid: 12000,
      },
    ]

    for (const bookingData of sampleBookings) {
      const eventType = await prisma.eventType.findUnique({
        where: { slug: bookingData.eventTypeSlug },
      })

      if (eventType) {
        const booking = await prisma.booking.create({
          data: {
            eventTypeId: eventType.id,
            fullName: bookingData.fullName,
            email: bookingData.email,
            phone: bookingData.phone,
            pickup: bookingData.pickup,
            peopleCount: bookingData.peopleCount,
            notes: bookingData.notes,
            startsAt: bookingData.startsAt,
            endsAt: bookingData.endsAt,
            timezone: bookingData.timezone,
            status: bookingData.status,
            paymentStatus: bookingData.paymentStatus,
            amountPaid: bookingData.amountPaid,
          },
        })

        // Create ride tracking for sample bookings
        await prisma.ride.create({
          data: {
            bookingId: booking.id,
            driverName: 'Mike Wilson',
            driverPhone: '+1-555-0789',
            vehicleInfo: '2023 Mercedes E-Class - Black',
            status: 'ASSIGNED',
          },
        })

        console.log(`✅ Sample booking created: ${booking.fullName}`)
      }
    }
  }

  console.log('🎉 Production database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
