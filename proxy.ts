import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/inngest"];
const PUBLIC_PAGE_PREFIXES = ["/login", "/signup", "/reset-password", "/verify-email", "/share"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass auth when Firebase is not yet configured (local dev without credentials).
  if (!process.env.FIREBASE_PROJECT_ID) return NextResponse.next();

  if (PUBLIC_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const session = req.cookies.get("__session")?.value;

  if (pathname.startsWith("/api/")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
