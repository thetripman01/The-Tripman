import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: "/admin/:path*",
};

export async function middleware(request: NextRequest) {
  // Allow login page
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  // For other admin pages, require the session cookie to exist.
  // (We verify the signature on the server/API routes. Middleware only gates navigation.)
  const session = request.cookies.get("admin_session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}
