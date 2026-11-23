// FILE: src/components/site-header.tsx
"use client";

import { CalendarDays, LogOut, Plus, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { listenGlobalRefresh } from "@/lib/refresh";

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
  const homeHref = session ? "/event" : "/";

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    const loadCount = async () => {
      try {
        const res = await fetch("/api/events/upcoming-count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled && typeof data.count === "number") setUpcomingCount(data.count);
      } catch {
        // silent fail
      }
    };

    loadCount();
    window.addEventListener("focus", loadCount);
    const stopListening = listenGlobalRefresh(loadCount);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadCount);
      stopListening();
    };
  }, [status, pathname, session?.user?.id, session?.user?.email]);

  const isEvents = pathname === "/event" || pathname.startsWith("/event/");

  if (pathname === "/") return null;

  return (
    <header className="border-border bg-background text-foreground sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={homeHref} className="flex items-center gap-2">
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
              className="border-border hover:bg-accent rounded-md border px-3 py-2 text-sm"
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
                  "hover:bg-accent hover:text-accent-foreground",
                  isEvents ? "bg-primary/10 text-primary" : "",
                ].join(" ")}
              >
                <span>Mes événements</span>
                {typeof upcomingCount === "number" && upcomingCount > 0 && (
                  <span
                    className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
                    title="Événements à venir ou à définir"
                    aria-label={`${upcomingCount} événement${upcomingCount > 1 ? "s" : ""} à venir ou à définir`}
                  >
                    {upcomingCount}
                  </span>
                )}
              </Link>

              {/* Mobile shortcut */}
              <Link
                href="/event"
                className="border-border hover:bg-accent inline-flex h-9 w-9 items-center justify-center rounded-full border sm:hidden"
                aria-label="Mes événements"
              >
                <CalendarDays size={18} />
              </Link>

              {/* One primary action */}
              <Link
                href="/event/new"
                aria-label="Créer un événement"
                title="Créer un événement"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-9 w-9 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
              >
                <Plus size={18} />
              </Link>

              {/* Avatar should NOT be another primary blob */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Ouvrir le menu du compte"
                    className="border-border bg-muted text-foreground hover:bg-accent focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {initial(session.user?.name, session.user?.email)}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="border-border w-56 rounded-xl border p-1 shadow-md"
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
