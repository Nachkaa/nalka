// FILE: src/components/site-header.tsx
"use client";

import { CalendarDays, LogOut, Plus, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initial(name?: string | null, email?: string | null) {
  return (name?.trim()?.[0] ?? email?.[0] ?? "U").toUpperCase();
}

export default function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [upcomingCount, setUpcomingCount] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    const loadCount = async () => {
      try {
        const res = await fetch("/api/events/upcoming-count");
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled && typeof data.count === "number") setUpcomingCount(data.count);
      } catch {
        // silent fail
      }
    };

    loadCount();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const isEvents = pathname === "/event" || pathname.startsWith("/event/");

  if (pathname === "/") return null;

  return (
    <header className="border-border text-foreground sticky top-0 z-40 border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-linear-to-r from-[var(--primary-500)] to-[var(--primary-600)] bg-clip-text text-lg font-semibold tracking-tight text-transparent">
            Nalka
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {status === "loading" && (
            <div
              aria-label="Chargement"
              className="h-9 w-9 animate-pulse rounded-full bg-[var(--muted)]"
            />
          )}

          {status !== "loading" && !session && (
            <Link
              href="/login?reset=1"
              className="rounded-md border border-[var(--header-border)] px-3 py-2 text-sm hover:bg-[color-mix(in_oklch,var(--header),black_4%)]"
            >
              Se connecter
            </Link>
          )}

          {session && (
            <>
              {/* One nav item only */}
              <Link
                href="/event"
                className={[
                  "hidden items-center gap-2 rounded-md px-3 py-2 text-sm sm:inline-flex",
                  "hover:bg-[color-mix(in_oklch,var(--header),black_4%)]",
                  isEvents ? "bg-[color-mix(in_oklch,var(--header),black_6%)]" : "",
                ].join(" ")}
              >
                <span>Mes événements</span>
                {typeof upcomingCount === "number" && upcomingCount > 0 && (
                  <span className="rounded-full bg-[color-mix(in_oklch,var(--primary),white_85%)] px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
                    {upcomingCount}
                  </span>
                )}
              </Link>

              {/* Mobile shortcut */}
              <Link
                href="/event"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--header-border)] hover:bg-[color-mix(in_oklch,var(--header),black_4%)] sm:hidden"
                aria-label="Mes événements"
              >
                <CalendarDays size={18} />
              </Link>

              {/* One primary action */}
              <Link
                href="/event/new"
                aria-label="Créer un événement"
                title="Créer un événement"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--background)] hover:bg-[color-mix(in_oklch,var(--primary),black_6%)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
              >
                <Plus size={18} />
              </Link>

              {/* Avatar should NOT be another primary blob */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Ouvrir le menu du compte"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--header-border) bg-(--header) text-sm font-semibold text-(--header-foreground) hover:bg-[color-mix(in_oklch,var(--header),black_4%)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
                  >
                    {initial(session.user?.name, session.user?.email)}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="border-border bg-background text-foreground w-56 rounded-xl border p-1 shadow-md"
                >
                  {session.user?.name && (
                    <>
                      <DropdownMenuLabel className="text-muted-foreground truncate px-2 py-1.5 text-xs">
                        {session.user.name}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm"
                    >
                      <User size={16} className="text-muted-foreground" />
                      <span>Mon profil</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/event"
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm"
                    >
                      <CalendarDays size={16} className="text-muted-foreground" />
                      <span>Mes événements</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void signOut({ redirect: false, callbackUrl: "/" }).then(() => {
                        window.location.assign("/");
                      });
                    }}
                    className="text-destructive focus:text-destructive flex items-center gap-2 rounded-lg px-2 py-2 text-sm"
                  >
                    <LogOut size={16} />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
