import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC = new Set<string>(["/", "/login", "/join", "/api/invite"]);

const hasSessionCookie = (req: NextRequest) =>
  Boolean(req.cookies.get("__Secure-authjs.session-token")?.value || req.cookies.get("authjs.session-token")?.value);

const PUBLIC_PREFIXES = [
  "/legal",           // e.g. /legal, /legal/cgu, /legal/privacy, /legal/cookies
  "/mentions-legales",
  "/cookies",
  "/privacy",
  "/terms",
  "/images",
  "/assets",
];

const isPublicPath = (pathname: string) =>
  PUBLIC.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

const withSecurity = (req: NextRequest, res: NextResponse) => {
  // dev: report-only CSP so nothing blocks
  res.headers.set(
    "Content-Security-Policy-Report-Only",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'strict-dynamic'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https: data:",
      "connect-src 'self' http: https: ws: wss:",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "object-src 'none'",
    ].join("; ")
  );
  return res;
};

export function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;

  // 1) Never touch ANY API, especially /api/auth
  if (pathname.startsWith("/api/")) return NextResponse.next();

  if (isPublicPath(pathname)) return withSecurity(req, NextResponse.next());

  const authed = hasSessionCookie(req);

  if (!authed) {
    const url = new URL("/login", origin);
    url.searchParams.set("from", pathname + (search || ""));
    return withSecurity(req, NextResponse.redirect(url));
  }

  if (authed && pathname === "/login") {
    return withSecurity(req, NextResponse.redirect(new URL("/event", origin)));
  }

  return withSecurity(req, NextResponse.next());
}

// Exclude auth + all api + next internals at matcher level
export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|images|assets).*)"],
};
