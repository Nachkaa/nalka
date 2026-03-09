// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC = new Set<string>(["/", "/login", "/join", "/api/invite"]);

const PUBLIC_PREFIXES = [
  "/legal", // e.g. /legal, /legal/cgu, /legal/privacy, /legal/cookies
  "/mentions-legales",
  "/cookies",
  "/privacy",
  "/terms",
  "/images",
  "/assets",
  "/gift-images",
];

const hasSessionCookie = (req: NextRequest) =>
  Boolean(
    req.cookies.get("__Secure-authjs.session-token")?.value ||
      req.cookies.get("authjs.session-token")?.value,
  );

const isPublicPath = (pathname: string) =>
  PUBLIC.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

const makeNonce = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes); // Edge runtime: Web Crypto only
  return btoa(String.fromCharCode(...bytes));
};

const buildCspReportOnly = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' 'wasm-unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https: data:",
    "connect-src 'self' http: https: ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

const withSecurity = (req: NextRequest, res: NextResponse) => {
  const nonce = makeNonce();

  // Report-Only while you validate. Switch to Content-Security-Policy when ready.
  res.headers.set("Content-Security-Policy-Report-Only", buildCspReportOnly(nonce));

  // Optional: allow debugging / future plumbing
  res.headers.set("x-nonce", nonce);

  return res;
};

export function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;

  // Never touch ANY API, especially /api/auth
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const authed = hasSessionCookie(req);

  // Public pages: allow through
  if (isPublicPath(pathname)) {
    // Authenticated users landing on / go straight to the app shell
    if (pathname === "/" && authed) {
      return withSecurity(req, NextResponse.redirect(new URL("/event", origin)));
    }

    return withSecurity(req, NextResponse.next());
  }

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

// Exclude auth + all api + next internals + static asset paths
export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|images|assets|gift-images).*)"],
};
