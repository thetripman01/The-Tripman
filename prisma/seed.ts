import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create default event types — single flat-rate package.
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
    await prisma.eventType.upsert({
      where: { slug: eventType.slug },
      update: { ...eventType, isActive: true },
      create: eventType,
    });
    console.log(`✅ Created/updated event type: ${eventType.name}`);
  }

  // Permanent GTA cities, all active by default, no date window.
  // Dropdowns sort alphabetically; isDefault pre-selects Toronto on the form.
  const gtaLocations = [
    { country: "Canada", city: "Toronto", isDefault: true },
    { country: "Canada", city: "Mississauga", isDefault: false },
    { country: "Canada", city: "Vaughan", isDefault: false },
    { country: "Canada", city: "Markham", isDefault: false },
    { country: "Canada", city: "Richmond Hill", isDefault: false },
  ] as const;

  for (const loc of gtaLocations) {
    await prisma.serviceLocation.upsert({
      where: { country_city: { country: loc.country, city: loc.city } },
      update: {
        isActive: true,
        isDefault: loc.isDefault,
        availableFrom: null,
        availableUntil: null,
      },
      create: {
        country: loc.country,
        city: loc.city,
        isActive: true,
        isDefault: loc.isDefault,
      },
    });
  }
  console.log(`✅ Seeded ${gtaLocations.length} GTA service locations`);

  // Tour cities — created INACTIVE so they don't appear to customers until
  // admin opens them with a specific date window. This keeps the dropdown
  // tidy and prevents accidentally accepting bookings for tour cities on
  // off-tour dates.
  const tourLocations = [
    { country: "Canada", city: "Ottawa" },
    { country: "Canada", city: "Quebec City" },
    { country: "Canada", city: "Montreal" },
    { country: "USA", city: "New York" },
    { country: "USA", city: "New Jersey" },
  ] as const;

  for (const loc of tourLocations) {
    await prisma.serviceLocation.upsert({
      where: { country_city: { country: loc.country, city: loc.city } },
      // Don't unset isActive on existing rows — admin may have already
      // turned them on with a date window. Only create if missing.
      update: {},
      create: {
        country: loc.country,
        city: loc.city,
        isActive: false,
        isDefault: false,
        note: "Tour city — enable + set date window when a tour is confirmed.",
      },
    });
  }
  console.log(`✅ Seeded ${tourLocations.length} tour cities (inactive)`);

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
