import type { Prisma } from "@prisma/client";
import { EventGiftMode } from "@prisma/client";

// tx = Prisma.TransactionClient
export async function syncGiftListsForEvent(tx: Prisma.TransactionClient, eventId: string) {
    const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
            id: true,
            ownerId: true,
            hasGifts: true,
            giftMode: true,
            title: true,
        },
    });
    if (!event) throw new Error("Event not found");

    // Pas de cadeaux => on ne touche pas aux listes
    if (!event.hasGifts) return;

    const [members, relatives, existingLists] = await Promise.all([
        tx.eventMember.findMany({
            where: { eventId },
            select: { userId: true },
        }),
        tx.eventRelative.findMany({
            where: { eventId },
            select: { id: true, firstName: true },
        }),
        tx.giftList.findMany({
            where: { eventId },
            select: { id: true, ownerId: true, eventRelativeId: true },
        }),
    ]);

    const hasListByOwner = new Set(
        existingLists.filter((l) => l.ownerId != null).map((l) => l.ownerId as string),
    );
    const hasListByRelative = new Set(
        existingLists
            .filter((l) => l.eventRelativeId != null)
            .map((l) => l.eventRelativeId as string),
    );

    // 1) Mode HOST_LIST => une seule liste pour l’owner
    if (event.giftMode === EventGiftMode.HOST_LIST) {
        if (!hasListByOwner.has(event.ownerId)) {
            await tx.giftList.create({
                data: {
                    ownerId: event.ownerId,
                    eventId: event.id,
                    title: event.title || "Ma liste",
                },
            });
        }
        return;
    }

    // 2) Modes PERSONAL_LISTS / SECRET_SANTA =>
    // une liste par member + par relative

    // Members
    for (const m of members) {
        if (!hasListByOwner.has(m.userId)) {
            await tx.giftList.create({
                data: {
                    ownerId: m.userId,
                    eventId: event.id,
                    title: "Ma liste",
                },
            });
        }
    }

    // Relatives
    for (const r of relatives) {
        if (!hasListByRelative.has(r.id)) {
            await tx.giftList.create({
                data: {
                    eventId: event.id,
                    eventRelativeId: r.id,
                    title: r.firstName ? `Liste de ${r.firstName}` : "Ma liste",
                },
            });
        }
    }
}
