"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    EyeOff,
    Lock,
    Recycle,
    Hammer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtEUR } from "@/lib/formatters";
import type { Event, EventMember } from "@prisma/client";
import { EventHeaderActions } from "../EventHeaderActions";

type EventWithFlags = Event & {
    memberships: EventMember[];
};

type Props = {
    event: EventWithFlags;
    slug: string;
    isAdmin: boolean;
    showBudget: boolean;
};

export function EventHeader({ event, slug, isAdmin, showBudget }: Props) {
    return (
        <>
            {/* 1. Breadcrumb + actions */}
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <nav aria-label="Breadcrumb">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/event" className="inline-flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Revenir à mes événements
                        </Link>
                    </Button>
                </nav>

                {/* mobile: ligne en dessous, alignée à droite
            md+ : à droite sur la même ligne que le breadcrumb */}
                <div className="flex justify-end md:justify-end">
                    <EventHeaderActions slug={slug} isAdmin={isAdmin} />
                </div>
            </div>

            {/* 2. Hero */}
            <header className="space-y-3">
                <div className="space-y-2">
                    <h1 className="text-pretty text-2xl font-bold leading-tight md:text-3xl">
                        {event.title}
                    </h1>

                    {/* badges row – meta info en chips */}
                    <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                        {event.eventOn && (
                            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                {fmtDate(event.eventOn)}
                            </span>
                        )}

                        {event.location && (
                            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                {event.location}
                            </span>
                        )}

                        {showBudget && (
                            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                                Budget max : {fmtEUR(event.budgetCapCents)}
                            </span>
                        )}
                    </div>
                </div>

                {event.description && (
                    <p className="max-w-prose text-sm text-[var(--muted-foreground)]">
                        {event.description}
                    </p>
                )}

                {/* rules / flags badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                    {event.isNoSpoil && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[var(--sidebar-primary)]">
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                            Pas de spoil
                        </span>
                    )}
                    {event.isAnonReservations && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[var(--sidebar-primary)]">
                            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                            Réservations anonymes
                        </span>
                    )}
                    {event.isSecondHandOk && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[var(--sidebar-primary)]">
                            <Recycle className="h-3.5 w-3.5" aria-hidden="true" />
                            Seconde main acceptée
                        </span>
                    )}
                    {event.isHandmadeOk && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[var(--sidebar-primary)]">
                            <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                            Cadeaux faits main acceptés
                        </span>
                    )}
                </div>
            </header>
        </>
    );
}
