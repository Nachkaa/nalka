"use client";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import GiftListAnimated, { GiftItemVM } from "../GiftListAnimated";
import { SuggestIdeaButton } from "@/components/gifts/SuggestIdeaButton";
import { InviteEmptyStateCTA } from "./AddEventMembers";
import { ReservationStatus } from "@prisma/client";
import type {
    GiftList,
    User,
    EventRelative,
    GiftItem,
    Reservation,
} from "@prisma/client";

export type GiftListWithParticipantAndItems = GiftList & {
    owner: User | null;
    eventRelative: EventRelative | null;
    items: (GiftItem & {
        reservations: (Reservation & { byUser: User })[];
    })[];
};

type Props = {
    eventId: string;
    slug: string;
    meId: string;
    otherLists: GiftListWithParticipantAndItems[];
    isAdmin: boolean;
    isAnonReservations: boolean;
};

function displayName(u?: { name: string | null; email: string | null } | null) {
    if (!u) return "Inconnu";
    if (u.name && u.name.trim()) return u.name.trim().split(/\s+/)[0];
    return u.email ?? "Inconnu";
}

export function EventOtherListsSection({
    eventId,
    slug,
    meId,
    otherLists,
    isAdmin,
    isAnonReservations,
}: Props) {
    if (otherLists.length === 0) {
        return (
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Listes des autres participants</h2>
                </div>

                <div className="rounded-lg border p-6 text-center">
                    <p className="mb-4 text-sm text-[var(--muted-foreground)]">
                        Invitez vos proches pour qu’ils ajoutent leurs listes.
                    </p>
                    {isAdmin && <InviteEmptyStateCTA eventId={eventId} />}
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">Listes des autres participants</h2>
            </div>

            {/* lists */}
            {otherLists.map((list) => {
                const rank = (it: (typeof list.items)[number]) => {
                    const taken = it.reservations.some(
                        (r) => r.status !== ReservationStatus.RESERVED,
                    );
                    const mine = it.reservations.some(
                        (r) => r.byUserId === meId && r.status === ReservationStatus.RESERVED,
                    );
                    return mine ? 0 : taken ? 2 : 1;
                };

                const hasMine = list.items.some((i) =>
                    i.reservations.some(
                        (r) => r.byUserId === meId && r.status === ReservationStatus.RESERVED,
                    ),
                );
                const reservedCount = list.items.filter((i) =>
                    i.reservations.some(
                        (r) => r.byUserId === meId && r.status === ReservationStatus.RESERVED,
                    ),
                ).length;

                const sortedItems = [...list.items].sort((a, b) => {
                    const diff = rank(a) - rank(b);
                    return diff !== 0 ? diff : a.title.localeCompare(b.title, "fr");
                });

                const ownerName =
                    list.eventRelative
                        ? list.eventRelative.firstName
                        : list.owner?.name ?? list.owner?.email ?? "Invité";

                const itemsVM: GiftItemVM[] = sortedItems.map((item) => {
                    const my = item.reservations.find(
                        (r) => r.byUserId === meId && r.status === ReservationStatus.RESERVED,
                    );
                    const other = item.reservations.find(
                        (r) => r.byUserId !== meId && r.status === ReservationStatus.RESERVED,
                    );

                    return {
                        id: item.id,
                        title: item.title,
                        url: item.url ?? null,
                        note: item.note ?? null,
                        isMine: !!my,
                        isTakenByOther: !!other,
                        imagePath: item.imagePath ?? null,
                        reservedByName:
                            !isAnonReservations && other?.byUser
                                ? displayName(other.byUser)
                                : null,
                    };
                });

                return (
                    <Card
                        key={list.id}
                        id={`list-${list.id}`}
                        className={
                            hasMine
                                ? "ring-1 ring-[var(--primary)] border-[var(--primary)]"
                                : ""
                        }
                    >
                        <CardHeader className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <CardTitle>
                                        {list.eventRelative
                                            ? list.eventRelative.firstName // proche
                                            : list.owner
                                                ? list.owner.name ?? list.owner.email ?? "Invité"
                                                : "Participant"}
                                    </CardTitle>
                                </div>

                                {reservedCount > 0 && (
                                    <p className="text-sm font-medium text-[var(--primary)]">
                                        🎁 {reservedCount}{" "}
                                        {reservedCount > 1
                                            ? "cadeaux réservés"
                                            : "cadeau réservé"}
                                    </p>
                                )}
                            </div>
                        </CardHeader>

                        {(() => {
                            const hasItems = itemsVM.length > 0;

                            if (hasItems) {
                                return (
                                    <>
                                        <CardContent>
                                            <GiftListAnimated
                                                items={itemsVM}
                                                eventId={eventId}
                                                showNames={!isAnonReservations}
                                            />
                                        </CardContent>

                                        <CardFooter className="border-[var(--border)]">
                                            <SuggestIdeaButton
                                                href={`/event/${slug}/suggest/${list.id}`}
                                                ownerName={ownerName}
                                            />
                                        </CardFooter>
                                    </>
                                );
                            }

                            return (
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Cette liste est encore vide. Tu peux proposer une première
                                        idée.
                                    </p>
                                    <SuggestIdeaButton
                                        href={`/event/${slug}/suggest/${list.id}`}
                                        ownerName={ownerName}
                                    />
                                </CardContent>
                            );
                        })()}
                    </Card>
                );
            })}
        </section>
    );
}
