import crypto from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const COOKIE_NAME = "admin_session";

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET");
  }
  return secret;
}

function sign(payloadB64: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
}

function encodePayload(payload: unknown) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(payloadB64: string) {
  return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
    uid?: string;
    exp?: number;
  };
}

export function createAdminSessionCookieValue(params: {
  userId: string;
  ttlSeconds?: number;
}) {
  const ttlSeconds = params.ttlSeconds ?? 60 * 60 * 8; // 8 hours
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;

  const payloadB64 = encodePayload({ uid: params.userId, exp });
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function getAdminUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = sign(payloadB64);
  const sigBuf = Buffer.from(sig, "base64url");
  const expectedBuf = Buffer.from(expected, "base64url");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  const payload = decodePayload(payloadB64);
  if (!payload.uid || !payload.exp) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  const adminUser = await db.adminUser.findUnique({
    where: { id: payload.uid },
  });
  return adminUser;
}

export async function requireAdmin(request: NextRequest) {
  try {
    const user = await getAdminUserFromRequest(request);
    if (!user) {
      return new NextResponse("Authentication required", { status: 401 });
    }
    return null;
  } catch (error) {
    console.error("Admin auth error:", error);
    return new NextResponse("Authentication required", { status: 401 });
  }
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function setAdminSessionCookie(
  response: NextResponse,
  cookieValue: string,
) {
  response.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}
