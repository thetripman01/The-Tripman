import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  clearAdminSessionCookie,
  createAdminSessionCookieValue,
  setAdminSessionCookie,
} from "@/lib/admin-session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const adminUser = await db.adminUser.findUnique({ where: { email } });
    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const ok = await bcrypt.compare(password, adminUser.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const cookieValue = createAdminSessionCookieValue({ userId: adminUser.id });
    const res = NextResponse.json({ ok: true });
    setAdminSessionCookie(res, cookieValue);
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid login data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Admin login error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Prisma throws a detailed init error when DATABASE_URL is missing/invalid.
    const looksLikeDbConfig =
      typeof message === "string" &&
      (message.includes("Error parsing connection string") ||
        message.includes("Invalid `prisma.") ||
        message.includes("DATABASE_URL"));

    if (looksLikeDbConfig) {
      return NextResponse.json(
        {
          error:
            "Database is not configured. Set DATABASE_URL, run `npm run db:push`, then `npm run db:seed` (or seed production).",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAdminSessionCookie(res);
  return res;
}
