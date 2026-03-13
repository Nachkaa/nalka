// src/proxy.ts
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
      req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value ||
      req.cookies.get("next-auth.session-token")?.value,
  );

const isPublicPath = (pathname: string) =>
  PUBLIC.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

const isSuspiciousPath = (pathname: string) =>
  pathname.endsWith(".php") ||
  pathname.includes(".php/") ||
  pathname === "/.env" ||
  pathname.startsWith("/.env.") ||
  pathname === "/wp-login.php" ||
  pathname === "/xmlrpc.php" ||
  pathname === "/admin/config.php";

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

export function proxy(req: NextRequest) {
  const startedAt = Date.now();
  const { pathname, origin, search } = req.nextUrl;
  console.info("[proxy] start path=%s", pathname);

  try {
    // Never touch ANY API, especially /api/auth
    if (pathname.startsWith("/api/")) {
      console.info("[proxy] ok path=%s durMs=%d", pathname, Date.now() - startedAt);
      return NextResponse.next();
    }

    if (isSuspiciousPath(pathname)) {
      console.info("[proxy] ok path=%s durMs=%d", pathname, Date.now() - startedAt);
      return NextResponse.next();
    }

    const authed = hasSessionCookie(req);

    // Public pages: allow through
    if (isPublicPath(pathname)) {
      // Authenticated users landing on guest-facing entry points go straight to the app shell
      if (authed && (pathname === "/" || pathname === "/login")) {
        const to = new URL("/event", origin);
        console.info("[proxy] redirect path=%s to=%s", pathname, to.pathname);
        return withSecurity(req, NextResponse.redirect(to));
      }

      console.info("[proxy] ok path=%s durMs=%d", pathname, Date.now() - startedAt);
      return withSecurity(req, NextResponse.next());
    }

    if (!authed) {
      const url = new URL("/login", origin);
      url.searchParams.set("from", pathname + (search || ""));
      console.info("[proxy] redirect path=%s to=%s", pathname, url.pathname);
      return withSecurity(req, NextResponse.redirect(url));
    }

    console.info("[proxy] ok path=%s durMs=%d", pathname, Date.now() - startedAt);
    return withSecurity(req, NextResponse.next());
  } catch (error) {
    console.error(
      "[proxy] fail path=%s durMs=%d error=%s",
      pathname,
      Date.now() - startedAt,
      error instanceof Error ? error.stack ?? error.message : String(error),
    );
    throw error;
  }
}

// Exclude auth + all api + next internals + static asset paths
export const config = {
  matcher: ["/((?!api/|api/auth/|_next/static|_next/image|favicon.ico|images|assets|gift-images).*)"],
};
