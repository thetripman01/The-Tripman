import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default event types
  const eventTypes = [
    {
      slug: 'birthday-uber-ride',
      name: 'Birthday Uber Ride',
      description: 'Make their birthday special with a luxury ride experience',
      durationMin: 60,
      priceCents: 7500, // $75.00
    },
    {
      slug: 'airport-pickup',
      name: 'Airport Pick-Up',
      description: 'Reliable and comfortable airport transportation service',
      durationMin: 45,
      priceCents: 6000, // $60.00
    },
    {
      slug: 'city-night-tour',
      name: 'City Night Tour',
      description: 'Explore the city lights with a guided night tour',
      durationMin: 90,
      priceCents: 12000, // $120.00
    },
    {
      slug: 'surprise-date-ride',
      name: 'Surprise Date Ride',
      description: 'Perfect for romantic surprises and special occasions',
      durationMin: 60,
      priceCents: 8500, // $85.00
    },
  ]

  for (const eventType of eventTypes) {
    await prisma.eventType.upsert({
      where: { slug: eventType.slug },
      update: eventType,
      create: eventType,
    })
    console.log(`✅ Created/updated event type: ${eventType.name}`)
  }

  // Create admin user if ADMIN_EMAIL and ADMIN_PASSWORD are set
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (adminEmail && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: { password: hashedPassword },
      create: {
        email: adminEmail,
        password: hashedPassword,
      },
    })
    console.log(`✅ Created/updated admin user: ${adminEmail}`)
  } else {
    console.log('⚠️  ADMIN_EMAIL and ADMIN_PASSWORD not set, skipping admin user creation')
  }

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
