import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";

const patchSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).optional(),
  newEmail: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  // We never return password hashes.
  const admin = await db.adminUser.findFirst({
    select: { id: true, email: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ admin });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const body = await request.json();
  const { currentPassword, newPassword, newEmail } = patchSchema.parse(body);

  const admin = await db.adminUser.findFirst({ orderBy: { createdAt: "asc" } });
  if (!admin) {
    return NextResponse.json(
      { error: "No admin user found in database. Run seed to create one." },
      { status: 500 },
    );
  }

  const ok = await bcrypt.compare(currentPassword, admin.password);
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 },
    );
  }

  if (!newPassword && !newEmail) {
    return NextResponse.json(
      { error: "Provide newPassword and/or newEmail." },
      { status: 400 },
    );
  }

  const data: { password?: string; email?: string } = {};
  if (newPassword) data.password = await bcrypt.hash(newPassword, 12);
  if (newEmail) data.email = newEmail;

  const updated = await db.adminUser.update({
    where: { id: admin.id },
    data,
    select: { id: true, email: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, admin: updated });
}
