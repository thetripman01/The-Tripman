import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding production database...");

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Missing ADMIN_EMAIL / ADMIN_PASSWORD (required for production seed)",
    );
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword },
    create: {
      email: adminEmail,
      password: hashedPassword,
    },
  });

  console.log("✅ Admin user created:", adminUser.email);

  // Create event types (Tripman packages) — single flat-rate package.
  const eventTypes = [
    {
      slug: "tripman-experience",
      name: "The Tripman Experience",
      description:
        "One full hour of chaos, music, and energy. Flat rate 99 CAD for 1–4 people. Video feature is not guaranteed — based on the energy of the night and luck.",
      durationMin: 60,
      priceCents: 9900, // 99 CAD
      isActive: true,
    },
  ] as const;

  // Deactivate any old/legacy event types so the UI shows ONLY the package above.
  await prisma.eventType.updateMany({
    where: { slug: { notIn: eventTypes.map((e) => e.slug) } },
    data: { isActive: false },
  });

  for (const eventType of eventTypes) {
    const created = await prisma.eventType.upsert({
      where: { slug: eventType.slug },
      update: { ...eventType, isActive: true },
      create: eventType,
    });
    console.log(`✅ Event type created: ${created.name}`);
  }

  // Default availability (only if none exists): every day 7pm → 3am
  const existingRules = await prisma.availabilityRule.count();
  if (existingRules === 0) {
    await prisma.availabilityRule.create({
      data: {
        timezone: process.env.BUSINESS_TIMEZONE || "America/Toronto",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: "19:00",
        endTime: "03:00",
        isAvailable: true,
        note: "Default Tripman schedule (seeded)",
      },
    });
    console.log("✅ Created default availability rule: daily 7pm → 3am");
  }

  // Create sample bookings for testing (optional)
  if (process.env.NODE_ENV === "development") {
    const sampleBookings = [
      {
        eventTypeSlug: "tripman-experience",
        fullName: "John Smith",
        email: "john@example.com",
        phone: "+1-555-0123",
        pickup: "Downtown Toronto",
        peopleCount: 2,
        notes: "Let’s do karaoke!",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
        timezone: "America/Toronto",
        status: "CONFIRMED" as const,
        paymentStatus: "COMPLETED" as const,
        amountPaid: 9900,
      },
    ];

    for (const bookingData of sampleBookings) {
      const eventType = await prisma.eventType.findUnique({
        where: { slug: bookingData.eventTypeSlug },
      });

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
        });

        // Create ride tracking for sample bookings
        await prisma.ride.create({
          data: {
            bookingId: booking.id,
            driverName: "Mike Wilson",
            driverPhone: "+1-555-0789",
            vehicleInfo: "2023 Mercedes E-Class - Black",
            status: "ASSIGNED",
          },
        });

        console.log(`✅ Sample booking created: ${booking.fullName}`);
      }
    }
  }

  console.log("🎉 Production database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
