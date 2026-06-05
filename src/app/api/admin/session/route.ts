import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  clearAdminSessionCookie,
  createAdminSessionCookieValue,
  setAdminSessionCookie,
} from "@/lib/admin-session";
import { clearRateLimit, getClientIp, rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email().max(254),
  // Cap on password length so an attacker can't DoS bcrypt with megabyte
  // passwords. bcrypt itself only hashes the first 72 bytes anyway.
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    // Per-IP brute force protection: 8 attempts per 15min, then a 15min
    // block. Combined with bcrypt's ~250ms cost this caps an attacker at
    // a handful of guesses per IP per quarter hour.
    const ip = getClientIp(request);
    const limited = rateLimit(ip, {
      key: "admin-login",
      limit: 8,
      windowMs: 15 * 60_000,
      blockDurationMs: 15 * 60_000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: limited.retryAfterSeconds
            ? { "Retry-After": String(limited.retryAfterSeconds) }
            : undefined,
        },
      );
    }

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

    // Reset the failed-attempts counter so a successful login doesn't
    // leave the user one mistake away from a 429 next time.
    clearRateLimit(ip, "admin-login");

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

    if (
      typeof message === "string" &&
      message.includes("Missing ADMIN_SESSION_SECRET")
    ) {
      return NextResponse.json(
        {
          error:
            "Server is missing ADMIN_SESSION_SECRET. Add it in Vercel Environment Variables (Production) and redeploy.",
        },
        { status: 500 },
      );
    }

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
