import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { businessDayEndUtc, businessDayStartUtc } from "@/lib/timezone";
import { isValidTimezone } from "@/lib/geo";

// PATCH / DELETE /api/admin/service-locations/[id]

const MAX_NAME_LENGTH = 100;
const MAX_NOTE_LENGTH = 500;

const patchSchema = z
  .object({
    country: z.string().trim().min(1).max(MAX_NAME_LENGTH).optional(),
    city: z.string().trim().min(1).max(MAX_NAME_LENGTH).optional(),
    isActive: z.boolean().optional(),
    availableFrom: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()])
      .optional(),
    availableUntil: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()])
      .optional(),
    isDefault: z.boolean().optional(),
    exclusive: z.boolean().optional(),
    // null or "" clears the override (back to auto). A non-empty string sets
    // an explicit IANA timezone (validated below).
    timezone: z.union([z.string().trim().max(64), z.null()]).optional(),
    note: z
      .union([z.string().trim().max(MAX_NOTE_LENGTH), z.null()])
      .optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.serviceLocation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = parsed.data;

  // Build update payload; only include fields that were explicitly sent.
  const updateData: Prisma.ServiceLocationUpdateInput = {};
  if (data.country !== undefined) updateData.country = data.country;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
  if (data.exclusive !== undefined) updateData.exclusive = data.exclusive;
  if (data.note !== undefined) updateData.note = data.note;

  if (data.timezone !== undefined) {
    // Blank/null => clear override (auto). Otherwise must be a valid IANA zone.
    const tz = data.timezone && data.timezone.length ? data.timezone : null;
    if (tz && !isValidTimezone(tz)) {
      return NextResponse.json(
        {
          error: `Invalid timezone "${tz}". Use an IANA name like Europe/Brussels.`,
        },
        { status: 400 },
      );
    }
    updateData.timezone = tz;
  }

  if (data.availableFrom !== undefined) {
    updateData.availableFrom = data.availableFrom
      ? businessDayStartUtc(data.availableFrom)
      : null;
  }
  if (data.availableUntil !== undefined) {
    updateData.availableUntil = data.availableUntil
      ? businessDayEndUtc(data.availableUntil)
      : null;
  }

  // Validate the resulting window. We must consider both newly-set values
  // and existing-but-unchanged values.
  const finalFrom =
    data.availableFrom !== undefined
      ? data.availableFrom
        ? businessDayStartUtc(data.availableFrom)
        : null
      : existing.availableFrom;
  const finalUntil =
    data.availableUntil !== undefined
      ? data.availableUntil
        ? businessDayEndUtc(data.availableUntil)
        : null
      : existing.availableUntil;
  if (finalFrom && finalUntil && finalUntil < finalFrom) {
    return NextResponse.json(
      { error: "availableUntil must be on or after availableFrom" },
      { status: 400 },
    );
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      // If turning this row into the default for its country, clear others.
      if (data.isDefault === true) {
        const country = data.country ?? existing.country;
        await tx.serviceLocation.updateMany({
          where: { country, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.serviceLocation.update({ where: { id }, data: updateData });
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "Another location with that country and city already exists.",
        },
        { status: 409 },
      );
    }
    console.error("Error updating service location:", error);
    return NextResponse.json(
      { error: "Failed to update service location" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await db.serviceLocation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Error deleting service location:", error);
    return NextResponse.json(
      { error: "Failed to delete service location" },
      { status: 500 },
    );
  }
}
