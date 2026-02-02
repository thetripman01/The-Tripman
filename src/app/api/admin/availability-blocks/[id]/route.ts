import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";

type AvailabilityBlockOps = {
  delete: (args: unknown) => Promise<unknown>;
};

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
