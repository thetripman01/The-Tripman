import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create default event types
  const eventTypes = [
    {
      slug: "tripman-experience",
      name: "The Tripman Experience",
      description:
        "One full hour of chaos, music, and unforgettable energy. 1–4 people: $200 • 5–7 people: $400.",
      durationMin: 60,
      priceCents: 20000, // From $200
      isActive: true,
    },
    {
      slug: "tripman-experience-plus",
      name: "The Tripman Experience +",
      description:
        "Everything in The Tripman Experience + full recording + guaranteed feature. 1–4 people: $500 • 5–7 people: $700.",
      durationMin: 60,
      priceCents: 50000, // From $500
      isActive: true,
    },
    {
      slug: "tripman-promo-ride",
      name: "The Tripman Promo Ride",
      description:
        "Showcase your brand in Tripman Car Karaoke. Prices determined after a discovery process (Afes Digital).",
      durationMin: 60,
      priceCents: null,
      isActive: true,
    },
  ] as const;

  // Deactivate any old event types so the UI shows ONLY the 3 packages above.
  await prisma.eventType.updateMany({
    where: { slug: { notIn: eventTypes.map((e) => e.slug) } },
    data: { isActive: false },
  });

  for (const eventType of eventTypes) {
    await prisma.eventType.upsert({
      where: { slug: eventType.slug },
      update: { ...eventType, isActive: true },
      create: eventType,
    });
    console.log(`✅ Created/updated event type: ${eventType.name}`);
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

  // Create admin user if ADMIN_EMAIL and ADMIN_PASSWORD are set (seed-time only)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: { password: hashedPassword },
      create: {
        email: adminEmail,
        password: hashedPassword,
      },
    });
    console.log(`✅ Created/updated admin user: ${adminEmail}`);
  } else {
    console.log(
      "⚠️  ADMIN_EMAIL and ADMIN_PASSWORD not set, skipping admin user creation",
    );
  }

  console.log("🎉 Database seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
