"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { syncGiftListsForEvent } from "@/domain/gift-lists";

export async function createEventRelativeAction(formData: FormData) {
    const session = await auth();
    if (!session?.user) redirect("/");

    const meId =
        session.user.id ??
        (
            await prisma.user.findUnique({
                where: { email: session.user.email! },
                select: { id: true },
            })
        )?.id;

    if (!meId) redirect("/");

    const eventId = formData.get("eventId")?.toString() ?? "";
    const slug = formData.get("slug")?.toString() ?? "";
    const from = (formData.get("from")?.toString() ?? "event") as
        | "event"
        | "participants";

    const profileId =
        (formData.get("profileId")?.toString() ?? "").trim() || null;

    const firstNameInput = formData.get("firstName")?.toString().trim() ?? "";
    const birthYearRaw = formData.get("birthYear")?.toString().trim();
    const addToFamily = formData.get("addToFamily") === "on";

    if (!eventId || !slug) {
        redirect(`/event/${slug || ""}`);
    }

    const baseTarget =
        from === "participants"
            ? `/event/${slug}/participants`
            : `/event/${slug}#participants`;

    let birthYear: number | null = null;
    if (birthYearRaw) {
        const parsed = Number.parseInt(birthYearRaw, 10);
        if (!Number.isNaN(parsed)) {
            birthYear = parsed;
        }
    }

    let managedProfileId: string | null = null;
    let firstNameToUse = firstNameInput;
    let birthYearToUse = birthYear;

    const hasProfileChoice = !!profileId;
    const hasNewData = !!firstNameToUse;

    if (hasProfileChoice && !hasNewData) {
        // Cas 1 : profil existant, pas de nouveau prénom → on réutilise le profil
        const profile = await prisma.managedProfile.findFirst({
            where: {
                id: profileId!,
                ownerId: meId,
            },
        });

        if (!profile) {
            redirect(
                `/event/${slug}/participants/add-relative?error=forbidden&from=${from}`,
            );
        }

        managedProfileId = profile!.id;
        firstNameToUse = profile!.firstName;
        birthYearToUse = profile!.birthYear ?? null;
    } else {
        // Cas 2 : pas de profil ou nouveau prénom saisi → nouveau proche
        if (!firstNameToUse) {
            redirect(
                `/event/${slug}/participants/add-relative?error=invalid&from=${from}`,
            );
        }

        if (addToFamily) {
            const profile = await prisma.managedProfile.create({
                data: {
                    ownerId: meId,
                    firstName: firstNameToUse,
                    birthYear: birthYearToUse,
                },
            });
            managedProfileId = profile.id;
        }
    }

    // --------- ANTI-DOUBLON ---------

    if (managedProfileId) {
        // même ManagedProfile déjà présent sur cet event ?
        const alreadyInEvent = await prisma.eventRelative.findFirst({
            where: {
                eventId,
                managedProfileId,
            },
            select: { id: true },
        });

        if (alreadyInEvent) {
            redirect(`${baseTarget}?relative=already-in-event`);
        }
    } else {
        // proche one-shot : même créateur + prénom + année ?
        const alreadyInEvent = await prisma.eventRelative.findFirst({
            where: {
                eventId,
                createdById: meId,
                firstName: firstNameToUse,
                birthYear: birthYearToUse,
            },
            select: { id: true },
        });

        if (alreadyInEvent) {
            redirect(`${baseTarget}?relative=already-in-event`);
        }
    }

    // --------- CRÉATION + SYNC LISTES (si gifts actifs) ---------

    await prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({
            where: { id: eventId },
            select: { id: true, hasGifts: true },
        });
        if (!event) {
            throw new Error("Event not found");
        }

        await tx.eventRelative.create({
            data: {
                eventId: event.id,
                createdById: meId,
                managedProfileId,
                firstName: firstNameToUse,
                birthYear: birthYearToUse,
            },
        });

        if (event.hasGifts) {
            await syncGiftListsForEvent(tx, event.id);
        }
    });

    redirect(baseTarget);
}
