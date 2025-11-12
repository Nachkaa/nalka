"use client";

import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronRight, Calendar, MapPin, Users, Sparkles  } from "lucide-react";
import type { EventSummary } from "@/features/events/types";

type Props = { initialEvents: EventSummary[] };

const CARD_CLASS =
  "group block rounded-3xl border bg-[var(--card)] p-6 shadow-sm outline-none transition";

export function EventList({ initialEvents }: Props) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const actifs = initialEvents.filter((e) => !e.date || e.date >= todayISO);
  const passes = initialEvents.filter((e) => e.date && e.date < todayISO);

  return (
    <section className="space-y-6">
      <Tabs defaultValue="actifs" className="w-full">
        <TabsList className="rounded-xl">
          <TabsTrigger value="actifs">Actifs</TabsTrigger>
          <TabsTrigger value="passes">Passés</TabsTrigger>
        </TabsList>

        <TabsContent value="actifs" className="mt-4">
          <EventListBlock items={actifs} empty="Aucun événement actif" />
        </TabsContent>

        <TabsContent value="passes" className="mt-4">
          <EventListBlock items={passes} empty="Aucun événement passé" />
        </TabsContent>
      </Tabs>
    </section>
  );
}


function EventListBlock({ items, empty }: { items: EventSummary[]; empty: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-[var(--card)] p-10 text-center text-[var(--muted-foreground)]">
        {empty}
      </div>
    );
  }

  return (
    <ul role="list" className="space-y-4">
      {items.map((e) => {
        const isSS = !!e.isSecretSanta;
        return (
          <li key={e.id}>
            <Link
              href={`/event/${e.slug ?? e.id}`}
              className="group block rounded-3xl border bg-[var(--card)] p-6 shadow-sm outline-none
                         transition-all duration-200 ease-out
                         hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
                         hover:bg-[color-mix(in_oklch,var(--card),black_3%)]
                         focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                         active:translate-y-[0px] active:shadow-sm"
            >
              <div className="grid grid-cols-[1fr_auto] items-center gap-6">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-semibold text-[var(--foreground)]">
                    {e.title}
                  </h3>

                  {/* ligne 1 : date + lieu + badge SS */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
                    {e.date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4 opacity-70 transition-colors group-hover:opacity-100" aria-hidden="true" />
                        {formatDate(e.date)}
                      </span>
                    )}

                    {e.location && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[160px]" title={e.location}>
                        <MapPin className="h-4 w-4 opacity-70 transition-colors group-hover:opacity-100" aria-hidden="true" />
                        {e.location}
                      </span>
                    )}

                    {isSS && (
                      <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Secret Santa
                      </span>
                    )}
                  </div>

                  {/* ligne 2 : participants + état ou progression */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4 opacity-70 transition-colors group-hover:opacity-100" aria-hidden="true" />
                      {e.invitedCount} {isSS ? "participants" : "invités"}
                    </span>

                    {isSS ? (
                      <span>{e.hasDraw ? "Tirage effectué" : "Tirage à lancer"}</span>
                    ) : (
                      <span>{e.progress}% des participants gâtés</span>
                    )}
                  </div>

                  {/* barre de progression – masquée en SS */}
                  {!isSS && (
                    <div
                      className="mt-3 h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={e.progress}
                    >
                      <div
                        className="h-2 rounded-full transition-[width] duration-500 ease-out"
                        style={{
                          width: `${Math.max(0, Math.min(100, e.progress))}%`,
                          background: `linear-gradient(
                            90deg,
                            color-mix(in oklch, var(--primary), white 25%) 0%,
                            var(--primary) 70%,
                            color-mix(in oklch, var(--primary), black 10%) 100%
                          )`,
                          boxShadow: "0 0 3px rgba(0,0,0,0.08)",
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <span className="hidden sm:inline">Accéder</span>
                  <ChevronRight className="h-5 w-5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}
