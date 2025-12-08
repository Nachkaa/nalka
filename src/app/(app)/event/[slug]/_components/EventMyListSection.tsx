import Link from "next/link";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GiftImagePreview } from "@/components/gifts/GiftImagePreview";
import ExpandableText from "@/components/ui/expandable-text";
import { deleteGift } from "../actions";
import { Info, Link2, Lock, Pencil, Trash2 } from "lucide-react";
import type { ReservationStatus } from "@prisma/client";

const STATUS_RELEASED: ReservationStatus = "RELEASED";

type ReservationLike = {
    status: ReservationStatus;
    byUser: {
        name: string | null;
        email: string | null;
    } | null;
};

type ItemLike = {
    id: string;
    title: string;
    note: string | null;
    url: string | null;
    imagePath: string | null;
    isSuggestion: boolean;
    reservations: ReservationLike[];
};

type MyList = {
    id: string;
    items: ItemLike[];
};

type Props = {
    eventId: string;
    slug: string;
    isNoSpoil: boolean;
    myList: MyList;
};

function displayName(u?: { name: string | null; email: string | null } | null) {
    if (!u) return "Inconnu";
    if (u.name && u.name.trim()) return u.name.trim().split(/\s+/)[0];
    return u.email ?? "Inconnu";
}

export function EventMyListSection({
    eventId,
    slug,
    isNoSpoil,
    myList,
}: Props) {
    const items = myList.items ?? [];
    const ownItems = items.filter((item) => !item.isSuggestion);
    const suggestedItems = items.filter((item) => item.isSuggestion);

    const renderItem = (item: ItemLike, showSuggestionBadge: boolean) => {
        const activeRes = (item.reservations ?? []).filter(
            (r) => r.status !== STATUS_RELEASED,
        );
        const hasActive = activeRes.length > 0;
        const showSpoil = !isNoSpoil && hasActive;
        const dim = !isNoSpoil && hasActive;

        return (
            <li
                key={item.id}
                className="flex flex-col gap-3 border-b py-3 text-sm md:flex-row md:items-center md:justify-between"
            >
                {/* Image + text */}
                <div className="flex min-w-0 flex-1 gap-3">
                    {item.imagePath && (
                        <GiftImagePreview
                            src={item.imagePath}
                            alt={item.title}
                            sizeClassName="h-24 w-24"
                        />
                    )}

                    <div className="min-w-0 flex-1">
                        {/* title + lock + link chip + suggestion badge */}
                        <div className="flex flex-wrap items-center gap-2">
                            {dim && (
                                <span title="Déjà réservé" className="inline-flex">
                                    <Lock
                                        className="h-4 w-4 text-[var(--muted-foreground)]"
                                        aria-hidden="true"
                                    />
                                </span>
                            )}

                            <span className={`truncate ${dim ? "opacity-70" : ""}`}>
                                {item.title}
                            </span>

                            {showSuggestionBadge && (
                                <span className="inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                                    Proposé par un participant
                                </span>
                            )}
                        </div>

                        {/* link chip */}
                        {(() => {
                            if (!item.url) return null;
                            let domain: string | null = null;
                            try {
                                domain = new URL(item.url).hostname.replace(/^www\./, "");
                            } catch {
                                domain = null;
                            }
                            return (
                                domain && (
                                    <div className="mt-1">
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                            title={item.url}
                                        >
                                            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                                            {domain}
                                        </a>
                                    </div>
                                )
                            );
                        })()}

                        {/* description */}
                        {item.note && (
                            <ExpandableText
                                text={item.note}
                                maxLines={4}
                                className="mt-1 text-xs"
                            />
                        )}

                        {/* reservation info if spoil allowed */}
                        {showSpoil &&
                            (() => {
                                const names = activeRes.map((r) => displayName(r.byUser));
                                return (
                                    <p className="mt-1 text-xs leading-snug text-[var(--muted-foreground)]">
                                        Réservé par {names.slice(0, 3).join(", ")}
                                        {names.length > 3 ? ` (+${names.length - 3})` : ""}
                                    </p>
                                );
                            })()}
                    </div>
                </div>

                {/* actions */}
                <div className="mt-1 flex items-center justify-end gap-2 md:mt-0 md:flex-shrink-0">
                    {/* EDIT */}
                    {!hasActive ? (
                        <Link href={`/event/${slug}/gift/${item.id}/edit`}>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="Modifier"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>
                    ) : isNoSpoil ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Modifier"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Modifier ce cadeau&nbsp;?</AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <p>
                                                Modifier ce cadeau peut impacter quelqu’un qui avait
                                                prévu de te l’offrir.
                                            </p>
                                            <p>
                                                Si quelqu’un l’a déjà réservé, il sera prévenu de ton
                                                changement.
                                            </p>
                                            <p>Tu veux quand même continuer&nbsp;?</p>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Link href={`/event/${slug}/gift/${item.id}/edit`}>
                                            <Button>Continuer</Button>
                                        </Link>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Modifier"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Ce cadeau est déjà réservé
                                    </AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <p>
                                                Modifier ces informations peut impacter la personne qui
                                                te l’offrira.
                                            </p>
                                            <p>Tu veux quand même continuer&nbsp;?</p>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Link href={`/event/${slug}/gift/${item.id}/edit`}>
                                            <Button variant="outline">Continuer</Button>
                                        </Link>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* DELETE */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="Supprimer"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {!hasActive
                                        ? "Supprimer ce cadeau ?"
                                        : isNoSpoil
                                            ? "Retirer ce cadeau ?"
                                            : "Ce cadeau est réservé"}
                                </AlertDialogTitle>

                                <AlertDialogDescription asChild>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        {!hasActive && (
                                            <p>« {item.title} » sera retiré de ta liste.</p>
                                        )}

                                        {hasActive && isNoSpoil && (
                                            <>
                                                <p>
                                                    Tu veux vraiment retirer « {item.title} » de ta
                                                    liste&nbsp;?
                                                </p>
                                                <p>
                                                    Si quelqu’un l’a déjà réservé, il sera prévenu et
                                                    pourra choisir autre chose.
                                                </p>
                                            </>
                                        )}

                                        {hasActive && !isNoSpoil && (
                                            <>
                                                <p>
                                                    Tu veux retirer « {item.title} » de ta
                                                    liste&nbsp;?
                                                </p>
                                                <p>
                                                    La personne qui l’avait réservé sera prévenue et pourra
                                                    choisir autre chose.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <AlertDialogCancel className="w-full sm:w-auto">
                                    Annuler
                                </AlertDialogCancel>

                                <form action={deleteGift} className="w-full sm:w-auto">
                                    <input type="hidden" name="itemId" value={item.id} />
                                    <input type="hidden" name="eventId" value={eventId} />
                                    <AlertDialogAction asChild>
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            className="w-full sm:w-auto"
                                        >
                                            {hasActive ? "Retirer de ma liste" : "Supprimer"}
                                        </Button>
                                    </AlertDialogAction>
                                </form>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </li>
        );
    };

    return (
        <Card>
            <CardHeader className="space-y-2">
                <CardTitle>Ma liste</CardTitle>

                <p className="flex gap-2 text-xs text-muted-foreground">
                    <Info
                        className="mt-[2px] hidden h-3.5 w-3.5 shrink-0 sm:block"
                        aria-hidden="true"
                    />
                    <span>
                        Ajoute, modifie ou supprime tes idées quand tu veux.
                        <span className="block">
                            Si quelqu’un a déjà réservé un cadeau, il sera prévenu en cas de
                            changement.
                        </span>
                    </span>
                </p>
            </CardHeader>

            <CardContent>
                {ownItems.length > 0 && (
                    <ul className="space-y-1">
                        {ownItems.map((item) => renderItem(item, false))}
                    </ul>
                )}

                {suggestedItems.length > 0 && (
                    <div className={ownItems.length > 0 ? "mt-4 pt-4" : ""}>
                        <p className="mb-2 text-xs font-medium tracking-wide text-[var(--muted-foreground)]">
                            Ces idées ont été suggérées par d’autres participants :
                        </p>
                        <ul className="space-y-1">
                            {suggestedItems.map((item) => renderItem(item, true))}
                        </ul>
                    </div>
                )}

                <Link
                    href={`/event/${slug}/add`}
                    className="mt-4 block rounded-lg bg-[var(--primary)] py-3 text-center font-medium text-[var(--primary-foreground)] transition hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]"
                >
                    Ajouter une idée
                </Link>
            </CardContent>
        </Card>
    );
}
