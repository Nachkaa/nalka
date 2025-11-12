"use client";

import Link from "next/link";
import { useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, CalendarDays } from "lucide-react";

function initials(name?: string | null, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    const i = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
    return i.toUpperCase() || "U";
  }
  return email?.[0]?.toUpperCase() ?? "U";
}

export default function SiteHeader() {
  const { data: session, status } = useSession();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = () => {
    if (detailsRef.current?.open) detailsRef.current.open = false;
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--header)]/95 text-[var(--header-foreground)] backdrop-blur border-[var(--header-border)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-[var(--header-foreground)]">
          <span className="font-semibold tracking-tight text-[var(--primary)]">NALKA</span>
        </Link>

        <div className="flex items-center gap-2">
          {status === "loading" && (
            <div aria-label="Chargement" className="h-9 w-9 animate-pulse rounded-full bg-[var(--muted)]" />
          )}

          {status !== "loading" && !session && (
            <Link
              href="/login?reset=1"
              className="rounded-md border px-3 py-2 text-sm border-[var(--header-border)] hover:bg-[color-mix(in_oklch,var(--header),black_4%)]"
            >
              Se connecter
            </Link>
          )}

          {session && (
            <details
              ref={detailsRef}
              className="relative"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  closeMenu();
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (!detailsRef.current?.open) {
                    if (detailsRef.current) detailsRef.current.open = true;
                  }
                  queueMicrotask(() => firstItemRef.current?.focus());
                }
              }}
            >
              <summary
                aria-label="Ouvrir le menu du compte"
                aria-haspopup="menu"
                aria-controls="account-menu"
                aria-expanded={detailsRef.current?.open ?? false}
                className="list-none cursor-pointer select-none rounded-full bg-[var(--primary)] text-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full">
                  {initials(session.user?.name, session.user?.email)}
                </span>
              </summary>

              <div
                id="account-menu"
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--header-border)] bg-[var(--header)] text-[var(--header-primary)] shadow-soft"
              >
                <div className="truncate px-3 py-2 text-xs text-[var(--muted-primary)]">
                  {session.user?.name}
                </div>

                <Link
                  ref={firstItemRef}
                  role="menuitem"
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--header-foreground)] visited:text-[var(--header-foreground)] hover:bg-[color-mix(in_oklch,var(--header),black_4%)] hover:text-[var(--header-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  onClick={closeMenu}
                >
                  <User size={16} />
                  <span>Profil</span>
                </Link>

                <Link
                  role="menuitem"
                  href="/event"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--header-foreground)] visited:text-[var(--header-foreground)] hover:bg-[color-mix(in_oklch,var(--header),black_4%)] hover:text-[var(--header-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  onClick={closeMenu}
                >
                  <CalendarDays size={16} />
                  <span>Événements</span>
                </Link>

                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--header-foreground)] hover:bg-[color-mix(in_oklch,var(--header),black_4%)] hover:text-[var(--header-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <LogOut size={16} />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}
