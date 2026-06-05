import {
  getCooldownMinutes,
  getSlotIntervalMinutes,
  getPendingHoldMinutes,
  findConflictingBooking,
} from "../booking-conflicts";
import type { Prisma, PrismaClient } from "@prisma/client";

describe("getSlotIntervalMinutes", () => {
  const original = process.env.SLOT_INTERVAL_MINUTES;
  afterEach(() => {
    process.env.SLOT_INTERVAL_MINUTES = original;
  });

  it("defaults to 30", () => {
    delete process.env.SLOT_INTERVAL_MINUTES;
    expect(getSlotIntervalMinutes()).toBe(30);
  });

  it("honors a valid override", () => {
    process.env.SLOT_INTERVAL_MINUTES = "15";
    expect(getSlotIntervalMinutes()).toBe(15);
  });

  it("falls back to 30 for garbage values", () => {
    process.env.SLOT_INTERVAL_MINUTES = "abc";
    expect(getSlotIntervalMinutes()).toBe(30);
    process.env.SLOT_INTERVAL_MINUTES = "-5";
    expect(getSlotIntervalMinutes()).toBe(30);
  });
});

describe("getCooldownMinutes", () => {
  const originalCool = process.env.COOLDOWN_MINUTES;
  const originalBuf = process.env.TRAVEL_BUFFER_MINUTES;
  afterEach(() => {
    process.env.COOLDOWN_MINUTES = originalCool;
    process.env.TRAVEL_BUFFER_MINUTES = originalBuf;
  });

  it("defaults to 30", () => {
    delete process.env.COOLDOWN_MINUTES;
    delete process.env.TRAVEL_BUFFER_MINUTES;
    expect(getCooldownMinutes()).toBe(30);
  });

  it("prefers COOLDOWN_MINUTES when both are set", () => {
    process.env.COOLDOWN_MINUTES = "45";
    process.env.TRAVEL_BUFFER_MINUTES = "60";
    expect(getCooldownMinutes()).toBe(45);
  });

  it("falls back to legacy TRAVEL_BUFFER_MINUTES", () => {
    delete process.env.COOLDOWN_MINUTES;
    process.env.TRAVEL_BUFFER_MINUTES = "20";
    expect(getCooldownMinutes()).toBe(20);
  });

  it("accepts 0 (no cooldown) as valid", () => {
    process.env.COOLDOWN_MINUTES = "0";
    expect(getCooldownMinutes()).toBe(0);
  });
});

describe("getPendingHoldMinutes", () => {
  const original = process.env.PAYMENT_HOLD_MINUTES;
  afterEach(() => {
    process.env.PAYMENT_HOLD_MINUTES = original;
  });

  it("defaults to 15", () => {
    delete process.env.PAYMENT_HOLD_MINUTES;
    expect(getPendingHoldMinutes()).toBe(15);
  });
});

// --- findConflictingBooking via stubbed Prisma client ---

interface RecordedQuery {
  where: Prisma.BookingWhereInput;
}

function makeStubDb(returnValue: unknown): {
  db: PrismaClient;
  calls: RecordedQuery[];
} {
  const calls: RecordedQuery[] = [];
  const db = {
    booking: {
      findFirst: jest.fn(async (args: RecordedQuery) => {
        calls.push(args);
        return returnValue;
      }),
    },
  } as unknown as PrismaClient;
  return { db, calls };
}

describe("findConflictingBooking (cooldown-aware overlap)", () => {
  beforeEach(() => {
    delete process.env.COOLDOWN_MINUTES;
    delete process.env.TRAVEL_BUFFER_MINUTES;
    delete process.env.PAYMENT_HOLD_MINUTES;
  });

  it("queries with cooldown-extended bounds on both sides", async () => {
    const { db, calls } = makeStubDb(null);
    const newStart = new Date("2026-07-15T20:00:00Z");
    const newEnd = new Date("2026-07-15T21:00:00Z");
    await findConflictingBooking(db, newStart, newEnd);
    expect(calls).toHaveLength(1);
    const where = calls[0].where;
    // startsAt: { lt: newEnd + 30min } → 21:30
    expect((where.startsAt as { lt: Date }).lt.toISOString()).toBe(
      "2026-07-15T21:30:00.000Z",
    );
    // endsAt: { gt: newStart - 30min } → 19:30
    expect((where.endsAt as { gt: Date }).gt.toISOString()).toBe(
      "2026-07-15T19:30:00.000Z",
    );
  });

  it("includes excludeBookingId in the where clause", async () => {
    const { db, calls } = makeStubDb(null);
    await findConflictingBooking(
      db,
      new Date("2026-07-15T20:00:00Z"),
      new Date("2026-07-15T21:00:00Z"),
      { excludeBookingId: "abc" },
    );
    const where = calls[0].where;
    expect(where.id).toEqual({ not: "abc" });
  });

  it("does NOT include id filter when no excludeBookingId provided", async () => {
    const { db, calls } = makeStubDb(null);
    await findConflictingBooking(
      db,
      new Date("2026-07-15T20:00:00Z"),
      new Date("2026-07-15T21:00:00Z"),
    );
    expect(calls[0].where.id).toBeUndefined();
  });

  it("uses a 0-minute cooldown when COOLDOWN_MINUTES=0", async () => {
    process.env.COOLDOWN_MINUTES = "0";
    const { db, calls } = makeStubDb(null);
    const newStart = new Date("2026-07-15T20:00:00Z");
    const newEnd = new Date("2026-07-15T21:00:00Z");
    await findConflictingBooking(db, newStart, newEnd);
    const where = calls[0].where;
    expect((where.startsAt as { lt: Date }).lt.toISOString()).toBe(
      "2026-07-15T21:00:00.000Z",
    );
    expect((where.endsAt as { gt: Date }).gt.toISOString()).toBe(
      "2026-07-15T20:00:00.000Z",
    );
  });

  it("includes both CONFIRMED and recent-PENDING bookings in OR", async () => {
    const { db, calls } = makeStubDb(null);
    await findConflictingBooking(
      db,
      new Date("2026-07-15T20:00:00Z"),
      new Date("2026-07-15T21:00:00Z"),
    );
    const ors = calls[0].where.OR as Prisma.BookingWhereInput[];
    expect(ors).toHaveLength(2);
    expect(ors[0]).toEqual({ status: "CONFIRMED" });
    expect(ors[1].status).toBe("PENDING");
    expect(ors[1].createdAt).toBeDefined();
  });
});
