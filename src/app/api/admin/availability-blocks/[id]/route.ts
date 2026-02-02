import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";

type AvailabilityBlockOps = {
  delete: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
};

const patchSchema = z.object({
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  reason: z.string().optional().nullable(),
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const availabilityBlock = (
    db as unknown as { availabilityBlock: AvailabilityBlockOps }
  ).availabilityBlock;

  const { id } = await params;
  await availabilityBlock.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const availabilityBlock = (
    db as unknown as { availabilityBlock: AvailabilityBlockOps }
  ).availabilityBlock;

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.parse(body);

  const startsAt = parsed.startsAt ? new Date(parsed.startsAt) : undefined;
  const endsAt = parsed.endsAt ? new Date(parsed.endsAt) : undefined;
  if (startsAt && endsAt && endsAt <= startsAt) {
    return NextResponse.json(
      { error: "End must be after start" },
      { status: 400 },
    );
  }

  // Prevent moving/resizing a block on top of existing bookings.
  if (startsAt || endsAt) {
    // Fetch current block to know full interval
    const current = await db.availabilityBlock.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    const nextStart = startsAt ?? current.startsAt;
    const nextEnd = endsAt ?? current.endsAt;

    const conflicts = await db.booking.findMany({
      where: {
        status: { not: "CANCELED" },
        startsAt: { lt: nextEnd },
        endsAt: { gt: nextStart },
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
            "This update overlaps existing bookings. Cancel the booking(s) first, then block the time.",
          conflicts,
        },
        { status: 409 },
      );
    }
  }

  const updated = await availabilityBlock.update({
    where: { id },
    data: {
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
      ...(parsed.reason !== undefined ? { reason: parsed.reason } : {}),
    },
  });

  return NextResponse.json(updated);
}
