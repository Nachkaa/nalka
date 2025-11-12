import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Public routes and protected prefixes
const PUBLIC = new Set<string>(["/", "/login", "/join", "/api/invite"]);
const PROTECTED_PREFIXES = ["/event", "/list", "/profile", "/settings"];

// Opaque DB-session cookie check (Auth.js v5)
function hasSessionCookie(req: NextRequest) {
  const c = req.cookies;
  return Boolean(
    c.get("__Secure-authjs.session-token")?.value ||
      c.get("authjs.session-token")?.value
  );
}

// --- Security headers helpers ---
function nonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // base64url
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function buildCsp(n: string) {
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `script-src 'self' 'nonce-${n}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https: data:",
    "connect-src 'self' https:",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function withSecurityHeaders(req: NextRequest, res: NextResponse) {
  const n = nonce();
  const csp = buildCsp(n);

  if (process.env.NODE_ENV === "production") {
    res.headers.set("Content-Security-Policy", csp);
  } else {
    res.headers.set("Content-Security-Policy-Report-Only", csp);
  }
  // expose nonce for <Script nonce={...}> if needed
  res.headers.set("x-nonce", n);

  // HSTS only on HTTPS and prod
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" ||
    req.nextUrl.protocol === "https:";
  if (process.env.NODE_ENV === "production" && isHttps) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");

  return res;
}

// --- Middleware ---
export function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;
  const isPublic = PUBLIC.has(pathname) || pathname.startsWith("/api/auth");
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const authed = hasSessionCookie(req);

  if (isPublic) {
    return withSecurityHeaders(req, NextResponse.next());
  }

  if (!authed && isProtected) {
    const url = new URL("/login", origin);
    url.searchParams.set("from", pathname + (search || ""));
    return withSecurityHeaders(req, NextResponse.redirect(url));
  }

  if (authed && pathname === "/login") {
    return withSecurityHeaders(req, NextResponse.redirect(new URL("/event", origin)));
  }

  return withSecurityHeaders(req, NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|assets|api/public).*)",
  ],
};
