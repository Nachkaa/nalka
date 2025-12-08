// app/event/[slug]/EventParticipantsSection.tsx

"use client";

import { AddParticipantLauncher } from "./AddParticipantLauncher";
import type { EventMember, User, EventRelative } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Users, Gift } from "lucide-react";
import Link from "next/link";

type EventMembershipWithUser = EventMember & {
    user: User | null;
};

type Props = {
    eventId: string;
    slug: string;
    meId: string;
    memberships: EventMembershipWithUser[];
    canRemoveByUserId: Record<string, boolean>;
    reservedCountByUserId?: Record<string, number>;
    relatives: EventRelative[];
    canRemoveRelativeById: Record<string, boolean>;
};

function displayName(u?: { name: string | null; email: string | null } | null) {
    if (!u) return "Inconnu";
    if (u.name && u.name.trim()) return u.name.trim().split(/\s+/)[0];
    return u.email ?? "Inconnu";
}

export function EventParticipantsSection({
    eventId,
    slug,
    meId,
    memberships,
    canRemoveByUserId,
    reservedCountByUserId,
    relatives,
    canRemoveRelativeById,
}: Props) {
    const hasRemovable =
        Object.values(canRemoveByUserId).some(Boolean) ||
        Object.values(canRemoveRelativeById).some(Boolean);

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">Participants</h2>

                {hasRemovable && (
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                    >
                        <Link href={`/event/${slug}/participants`}>
                            <Users className="mr-1 h-3 w-3" />
                            Gérer
                        </Link>
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap gap-4">
                {memberships.map((m) => {
                    const name = displayName(m.user);
                    const initials = (m.user?.name ?? m.user?.email ?? "?")
                        .split(/[^\p{L}\p{N}]+/u)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((s) => s[0])
                        .join("")
                        .toUpperCase();

                    const isMe = m.userId === meId;
                    const reservedCount = reservedCountByUserId?.[m.userId] ?? 0;
                    const hasMine = reservedCount > 0;

                    return (
                        <div
                            key={`participant-${m.userId}`}
                            className="flex w-16 flex-col items-center gap-1"
                        >
                            <div className="relative">
                                <div
                                    className={`inline-flex h-12 w-12 select-none items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--sidebar-primary)] ${isMe
                                        ? "ring-2 ring-[var(--primary)] bg-[color-mix(in_oklch,var(--primary),white_88%)]"
                                        : "ring-1 ring-[var(--border)]"
                                        }`}
                                    title={name}
                                    aria-label={isMe ? `${name} (toi)` : name}
                                >
                                    {initials}
                                </div>

                                {hasMine && (
                                    <span className="absolute -bottom-2 -left-2 inline-flex items-center gap-0.5 rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-xs font-medium text-[var(--primary-foreground)] shadow">
                                        <Gift className="h-3 w-3" />
                                        {reservedCount}
                                    </span>
                                )}
                            </div>

                            <span className="w-full truncate text-center text-xs text-[var(--muted-foreground)]">
                                {isMe ? `${name} (toi)` : name}
                            </span>
                        </div>
                    );
                })}
                {relatives.map((rel) => {
                    const initials = rel.firstName
                        .split(/[^\p{L}\p{N}]+/u)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((s) => s[0])
                        .join("")
                        .toUpperCase();

                    const isRemovable = canRemoveRelativeById[rel.id] === true;

                    return (
                        <div
                            key={`relative-${rel.id}`}
                            className="flex w-16 flex-col items-center gap-1"
                        >
                            <div className="relative">
                                <div
                                    className="inline-flex h-12 w-12 select-none items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--sidebar-primary)] ring-1 ring-[var(--border)]"
                                    title={rel.firstName}
                                    aria-label={rel.firstName}
                                >
                                    {initials}
                                </div>
                                {/* Pas de badge Gift ici pour l’instant (reservedCountByUserId est indexé par userId) */}
                            </div>

                            <span className="w-full truncate text-center text-xs text-[var(--muted-foreground)]">
                                {rel.firstName}
                            </span>
                        </div>
                    );
                })}



                <div className="">
                    <AddParticipantLauncher
                        eventId={eventId}
                        slug={slug}
                    />
                </div>

            </div>
        </section>
    );
}