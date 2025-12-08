import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserMinus, UserPlus } from "lucide-react";
import { AddParticipantLauncher } from "../_components/AddParticipantLauncher";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EventMemberRole as ROLE, type EventRelative } from "@prisma/client";
import { requireEventForUser } from "@/features/events/permissions";
import { removeRelative } from "../actions";


import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

type Props = {
    params: { slug: string };
};

function displayName(u?: { name: string | null; email: string | null } | null) {
    if (!u) return "Inconnu";
    if (u.name && u.name.trim()) return u.name.trim();
    return u.email ?? "Inconnu";
}

export default async function ManageParticipantsPage({ params }: Props) {
    const { slug } = await params;
    if (!slug) notFound();

    const session = await auth();
    if (!session?.user) return <main className="p-6">Non autorisé</main>;

    const meId =
        session.user.id ??
        (
            await prisma.user.findUnique({
                where: { email: session.user.email! },
                select: { id: true },
            })
        )?.id;

    if (!meId) return <main className="p-6">Non autorisé</main>;

    const event = await requireEventForUser(slug, meId);
    if (!event) notFound();

    const roleByUser = new Map(event.memberships.map((m) => [m.userId, m.role]));
    const myRole = roleByUser.get(meId);

    const canRemoveByUserId = new Map<string, boolean>();
    for (const m of event.memberships) {
        const isSelf = m.userId === meId;
        const isOwner = m.role === ROLE.OWNER;

        let canRemove = false;
        if (!isSelf) {
            if (myRole === ROLE.OWNER) canRemove = true;
            else if (myRole === ROLE.ADMIN && !isOwner) canRemove = true;
        }
        canRemoveByUserId.set(m.userId, canRemove);
    }

    const relativesByUserId = new Map<string, EventRelative[]>();
    const canRemoveRelativeById = new Map<string, boolean>();

    for (const rel of event.relatives ?? []) {
        const ownerId = rel.managedProfile?.ownerId ?? rel.createdById;

        if (!relativesByUserId.has(ownerId)) {
            relativesByUserId.set(ownerId, []);
        }
        relativesByUserId.get(ownerId)!.push(rel);

        const isOwnerOrAdmin =
            myRole === ROLE.OWNER || myRole === ROLE.ADMIN;
        const canRemove = isOwnerOrAdmin || ownerId === meId;

        canRemoveRelativeById.set(rel.id, canRemove);
    }



    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
            {/* header */}
            <div className="flex items-center justify-between gap-2">
                <Button asChild variant="ghost" size="sm">
                    <Link href={`/event/${slug}`}>
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Revenir à l’événement
                    </Link>
                </Button>
            </div>

            <p className="text-sm text-[var(--muted-foreground)]">
                Ajoute ou retire des personnes pour cet événement.
            </p>

            {/* liste de gestion, full-page */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Participants</h2>
                    {/* on peut garder un bouton “Ajouter” plus tard si tu veux */}
                </div>

                <div className="space-y-2">
                    {event.memberships.map((m) => {
                        const name = displayName(m.user);
                        const email = m.user?.email ?? "";
                        const showEmail = name.toLowerCase() !== email.toLowerCase();
                        const initials = (m.user?.name ?? m.user?.email ?? "?")
                            .split(/[^\p{L}\p{N}]+/u)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((s) => s[0])
                            .join("")
                            .toUpperCase();

                        const canRemove = !!canRemoveByUserId.get(m.userId);
                        const relatives = relativesByUserId.get(m.userId) ?? [];

                        return (
                            <div key={m.userId} className="space-y-1">
                                {/* ligne du membre */}
                                <div className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
                                    {/* avatar */}
                                    <div className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--sidebar-primary)] ring-1 ring-[var(--border)]">
                                        {initials}
                                    </div>

                                    {/* texte */}
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-sm font-medium">{name}</span>

                                        {showEmail && (
                                            <span className="truncate text-xs text-[var(--muted-foreground)]">
                                                {email}
                                            </span>
                                        )}
                                    </div>

                                    {/* action, collée au bord droit */}
                                    {canRemove && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    className="ml-auto h-8 w-8 flex-shrink-0"
                                                    aria-label={`Retirer ${name}`}
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Retirer {name} ?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Ce participant et tout ce qui lui est lié (liste, réservations,
                                                        idées…) seront retirés de cet événement.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    {/* branche ton removeMember ici quand tu veux */}
                                                    <AlertDialogAction asChild>
                                                        <Button type="submit" variant="destructive">
                                                            Retirer
                                                        </Button>
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>

                                {/* proches créés par ce membre */}
                                {relatives.length > 0 && (
                                    <div className="ml-10 space-y-1 border-l border-dashed border-[var(--border)] pl-3">
                                        {relatives.map((rel) => {
                                            const initials = rel.firstName
                                                .split(/[^\p{L}\p{N}]+/u)
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .map((s) => s[0])
                                                .join("")
                                                .toUpperCase();

                                            const canRemoveRelative =
                                                canRemoveRelativeById.get(rel.id) === true;

                                            return (
                                                <div
                                                    key={rel.id}
                                                    className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs"
                                                >
                                                    <div className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[0.65rem] font-semibold text-[var(--sidebar-primary)] ring-1 ring-[var(--border)]">
                                                        {initials}
                                                    </div>

                                                    <span className="flex-1 truncate">
                                                        {rel.firstName}
                                                        {typeof rel.birthYear === "number" && (
                                                            <span className="ml-1 text-[0.7rem] text-[var(--muted-foreground)]">
                                                                ({rel.birthYear})
                                                            </span>
                                                        )}
                                                    </span>

                                                    {canRemoveRelative && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon-sm"
                                                                    className="h-7 w-7 flex-shrink-0"
                                                                    aria-label={`Retirer ${rel.firstName}`}
                                                                >
                                                                    <UserMinus className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Retirer {rel.firstName} ?
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Ce proche et sa liste de cadeaux seront retirés de cet
                                                                        événement. Les réservations associées seront aussi
                                                                        libérées.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                    <form action={removeRelative}>
                                                                        <input type="hidden" name="slug" value={slug} />
                                                                        <input type="hidden" name="eventId" value={event.id} />
                                                                        <input type="hidden" name="relativeId" value={rel.id} />
                                                                        <AlertDialogAction asChild>
                                                                            <Button type="submit" variant="destructive">
                                                                                Retirer
                                                                            </Button>
                                                                        </AlertDialogAction>
                                                                    </form>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}


                    {/* bloc d’ajout en bas */}
                    <div className="pt-2">
                        <AddParticipantLauncher eventId={event.id} slug={slug} context="participants" />
                    </div>
                </div>
            </section>
        </main>
    );
}
