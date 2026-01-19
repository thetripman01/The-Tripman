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
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAdminSessionCookie(res);
  return res;
}
