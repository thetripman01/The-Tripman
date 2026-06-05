import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { businessDayEndUtc, businessDayStartUtc } from "@/lib/timezone";

// Admin CRUD for ServiceLocation. Behind admin auth.
//
// Conventions:
//   - country/city are trimmed and length-bounded to avoid garbage data.
//   - availableFrom/availableUntil are calendar dates (YYYY-MM-DD). We store
//     them as UTC midnight for `from` and UTC end-of-day for `until` so that
//     isLocationAvailableOn() can compare inclusively without surprises.
//   - At most one isDefault row per country. Setting a new default
//     atomically clears the previous one in the same transaction.

const MAX_NAME_LENGTH = 100;
const MAX_NOTE_LENGTH = 500;

const createSchema = z.object({
  country: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  city: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  isActive: z.boolean().default(true),
  availableFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  availableUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  isDefault: z.boolean().default(false),
  exclusive: z.boolean().default(false),
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const locations = await db.serviceLocation.findMany({
    // Active first, then alphabetical by country and city.
    orderBy: [{ isActive: "desc" }, { country: "asc" }, { city: "asc" }],
  });

  return NextResponse.json(locations);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  // Store as the BUSINESS-TZ day boundaries (not UTC midnight) — otherwise
  // "Jun 12" entered in admin gets stored as Jun 11 8pm EDT, which fires
  // tour windows a day early. See lib/timezone.ts for rationale.
  const availableFrom = data.availableFrom
    ? businessDayStartUtc(data.availableFrom)
    : null;
  const availableUntil = data.availableUntil
    ? businessDayEndUtc(data.availableUntil)
    : null;

  if (availableFrom && availableUntil && availableUntil < availableFrom) {
    return NextResponse.json(
      { error: "availableUntil must be on or after availableFrom" },
      { status: 400 },
    );
  }

  try {
    const created = await db.$transaction(async (tx) => {
      if (data.isDefault) {
        // Ensure at most one default per country.
        await tx.serviceLocation.updateMany({
          where: { country: data.country, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.serviceLocation.create({
        data: {
          country: data.country,
          city: data.city,
          isActive: data.isActive,
          availableFrom,
          availableUntil,
          isDefault: data.isDefault,
          exclusive: data.exclusive,
          note: data.note,
        },
      });
    });

    return NextResponse.json(created);
  } catch (error) {
    // Unique constraint on (country, city)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A location with that country and city already exists." },
        { status: 409 },
      );
    }
    console.error("Error creating service location:", error);
    return NextResponse.json(
      { error: "Failed to create service location" },
      { status: 500 },
    );
  }
}
