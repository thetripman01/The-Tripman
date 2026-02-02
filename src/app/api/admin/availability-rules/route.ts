import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";

const ruleSchema = z.object({
  timezone: z.string().min(1).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.boolean().default(true),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.AND = [
      from
        ? { OR: [{ endDate: null }, { endDate: { gte: new Date(from) } }] }
        : {},
      to
        ? { OR: [{ startDate: null }, { startDate: { lte: new Date(to) } }] }
        : {},
    ];
  }

  const rules = await db.availabilityRule.findMany({
    where,
    orderBy: [{ isAvailable: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const body = await request.json();
  const parsed = ruleSchema.parse(body);

  const startDate = parsed.startDate
    ? new Date(parsed.startDate + "T00:00:00.000Z")
    : null;
  const endDate = parsed.endDate
    ? new Date(parsed.endDate + "T23:59:59.999Z")
    : null;

  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json(
      { error: "endDate must be after startDate" },
      { status: 400 },
    );
  }

  const rule = await db.availabilityRule.create({
    data: {
      timezone: parsed.timezone || "America/Toronto",
      daysOfWeek: parsed.daysOfWeek,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      isAvailable: parsed.isAvailable,
      startDate,
      endDate,
      note: parsed.note,
    },
  });

  return NextResponse.json(rule);
}
