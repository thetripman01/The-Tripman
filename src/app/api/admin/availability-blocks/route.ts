import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";

type AvailabilityBlockOps = {
  findMany: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
};

const createSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  // NOTE: Prisma types can lag in some Windows/tooling setups after schema changes.
  // At runtime, Prisma client has this delegate after `prisma generate`.
  // We keep the cast local to avoid spreading `any`.
  const availabilityBlock = (
    db as unknown as { availabilityBlock: AvailabilityBlockOps }
  ).availabilityBlock;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.AND = [
      from ? { endsAt: { gt: new Date(from) } } : {},
      to ? { startsAt: { lt: new Date(to) } } : {},
    ];
  }

  const blocks = await availabilityBlock.findMany({
    where,
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(blocks);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const availabilityBlock = (
    db as unknown as { availabilityBlock: AvailabilityBlockOps }
  ).availabilityBlock;

  const body = await request.json();
  const { startsAt, endsAt, reason } = createSchema.parse(body);

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (end <= start) {
    return NextResponse.json(
      { error: "End must be after start" },
      { status: 400 },
    );
  }

  // Prevent blocking over already-booked (non-canceled) rides.
  const conflicts = await db.booking.findMany({
    where: {
      status: { not: "CANCELED" },
      startsAt: { lt: end },
      endsAt: { gt: start },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      startsAt: true,
      endsAt: true,
      eventType: { select: { name: true } },
    },
    take: 5,
  });

  if (conflicts.length > 0) {
    return NextResponse.json(
      {
        error:
          "This time overlaps existing bookings. Cancel the booking(s) first, then block the time.",
        conflicts,
      },
      { status: 409 },
    );
  }

  const block = await availabilityBlock.create({
    data: {
      startsAt: start,
      endsAt: end,
      reason,
    },
  });

  return NextResponse.json(block);
}
