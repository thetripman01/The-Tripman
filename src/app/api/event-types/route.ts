import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // If DATABASE_URL is malformed (common during setup), avoid hammering Prisma and return an empty list.
    // This keeps the UI usable while setup is completed.
    const raw = process.env.DATABASE_URL;
    if (!raw) {
      return NextResponse.json([]);
    }
    if (!URL.canParse(raw)) {
      return NextResponse.json([]);
    }

    const eventTypes = await db.eventType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error("Error fetching event types:", error);
    return NextResponse.json(
      { error: "Failed to fetch event types" },
      { status: 500 },
    );
  }
}
