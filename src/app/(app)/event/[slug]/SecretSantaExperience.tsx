"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Sparkles, Gift, Users, Hammer, Recycle, Banknote, UserMinus, Pencil   } from "lucide-react";
import InviteMemberChip from "./InviteMemberChip";
import { useTransition, useEffect, useState } from "react";
import { launchDraw } from "./draw";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { emitGlobalRefresh } from "@/lib/refresh";
import LeaveEventDialog from "./LeaveEventDialog";
import { removeMember } from "./actions";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { InviteShareDialog } from "./InviteShareDialog";



type TargetItem = { id: string; title: string; url: string | null; note: string | null };
type MeTarget = {
  receiver: { id: string; name: string | null; email: string | null };
  listId: string | null;
  receiverItems: TargetItem[];
} | null;

type Props = {
  event: {
    id: string;
    title: string;
    description: string | null;
    eventOn: Date | null;
    location: string | null;
    isSecretSanta: boolean;
    hasDraw?: boolean;
    isNoSpoil: boolean;
    isAnonReservations: boolean;
    budgetCapCents: number | null;
    isSecondHandOk: boolean;
    isHandmadeOk: boolean;
    lists: {
      id: string;
      ownerId: string;
      owner: { name: string | null; email: string | null };
      items: {
        id: string;
        title: string;
        url: string | null;
        note: string | null;
        reservations: { id: string; byUserId: string; status: string }[];
      }[];
    }[];
    memberships: { userId: string }[];
  };
  meId: string;
  slug: string;
  isAdmin: boolean;
};

export default function SecretSantaExperience({ event, meId, slug, isAdmin }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
  
    const myList = useMemo(
        () => event.lists.find((l) => l.ownerId === meId) ?? null,
        [event.lists, meId]
      );
      const others = useMemo(
        () => event.lists.filter((l) => l.ownerId !== meId),
        [event.lists, meId]
      );
      const membersCount = event.memberships.length;
      const fmtEUR = (cents?: number | null) =>
       typeof cents === "number"
         ? (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
         : null;

      const fmtDate = (d?: Date | null) =>
        d ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d) : null;

      const displayName = (u?: { name: string | null; email: string | null } | null) => {
        if (!u) return "Inconnu";
        if (u.name && u.name.trim()) return u.name.trim();
        return u.email ?? "Inconnu";
        };

      const [target, setTarget] = useState<MeTarget>(null);
        useEffect(() => {
          let alive = true;
          fetch(`/api/secret-santa/${event.id}/me`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => { if (alive && data?.receiver) setTarget(data); })
            .catch(() => {});
          return () => { alive = false; };
        }, [event.id]);
      const targetId = target?.receiver.id ?? null;
      const hasDraw = (event as any).hasDraw ?? !!target;

      useEffect(() => {
        let alive = true;
        fetch(`/api/secret-santa/${event.id}/me`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => { if (alive && data?.receiver) setTarget(data); })
          .catch(() => {});
        return () => { alive = false; };
      }, [event.id]);

      async function fetchMyTarget(eventId: string): Promise<MeTarget> {
        try {
          const r = await fetch(`/api/secret-santa/${eventId}/me`, { cache: "no-store" });
          if (!r.ok) return null;
          return (await r.json()) as MeTarget;
        } catch {
          return null;
        }
      }

      const canRemove = (ownerId: string) => isAdmin && ownerId !== meId;

  return (
    <main className="space-y-8 p-0">
      {/* Ligne ~25: barre de retour + edit visible pour admin */}
      <nav aria-label="Fil de navigation" className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/event" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Revenir à mes événements
          </Link>
        </Button>
      </nav>

      {/* Ligne ~50: en-tête */}
       {/* Header */}
      <header className="mb-2 grid gap-3 md:flex md:items-start md:justify-between">
        <h1 className="min-w-0 text-pretty text-2xl font-bold leading-tight md:text-3xl">
          {event.title}
        </h1>

        {/* Actions: pills, same style as ailleurs */}
        <div className="flex flex-wrap gap-2 md:items-center">
          <InviteShareDialog eventRef={slug} />

          {isAdmin ? (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="rounded-full px-3"
              aria-label="Modifier l’événement"
            >
              <Link href={`/event/${slug}/edit`} prefetch={false}>
                <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Modifier
              </Link>
            </Button>
          ) : (
            <LeaveEventDialog eventId={event.id} />
          )}
        </div>
      </header>

      {/* Ligne ~60: méta + badge SS */}
      <section aria-labelledby="ss-meta" className="space-y-3">
        {event.description && (
          <p className="max-w-prose text-[var(--muted-foreground)]">{event.description}</p>
        )}
        <div id="ss-meta" className="flex flex-wrap items-center gap-2 text-sm">
          {event.eventOn && (
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {fmtDate(event.eventOn)}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {event.location}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Secret Santa activé
            </span>
        </div>
      </section>

      {target && (
        <motion.section
          aria-labelledby="my-target"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl ring-1 ring-[var(--primary)]/15 ring-offset-0
                     bg-[color-mix(in_oklch,white_88%,var(--primary))]
                     p-6 shadow-sm"
        >
          {/* subtle gradient vignette for depth */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0
                       bg-[radial-gradient(1200px_500px_at_20%_-10%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_60%)]
                       opacity-70"
          />
      
          <div className="relative flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full
                            bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
          
            <div className="min-w-0">
              <h2 id="my-target" className="text-sm font-medium text-[var(--muted-foreground)]">
                Tu offres un cadeau à
              </h2>
              <p className="text-2xl font-bold leading-tight tracking-tight">
                {displayName(target.receiver)}
              </p>
            </div>
          </div>
          
          {/* inline list if exists */}
          {target.listId && target.receiverItems.length > 0 ? (
            <div className="relative mt-4">
              <h3 className="mb-2 text-sm font-medium text-[var(--muted-foreground)]">Ses idées</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {target.receiverItems.map((it) => (
                  <li key={it.id}
                      className="rounded-xl border border-black/5 bg-white/90 px-4 py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium truncate">{it.title}</span>
                      {it.url ? (
                        <a href={it.url} target="_blank" rel="noopener noreferrer"
                           className="text-xs underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 rounded">
                          Lien
                        </a>
                      ) : null}
                    </div>
                    {it.note ? (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                        {it.note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                Seul toi vois cette section.
              </p>
            </div>
          ) : (
            <p className="relative mt-2 text-sm text-[var(--muted-foreground)]">
              Trouve des idées en pensant à cette personne.
            </p>
          )}
        </motion.section>
      )}


      {/* Ligne ~80: Tirage au sort – boutons actifs pour admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--primary)]" />
            Tirage au sort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
           {hasDraw ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Le tirage a été effectué. Chacun voit désormais la personne à qui offrir un cadeau.
              </p>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                Une fois le tirage effectué, chacun verra la personne à qui offrir un cadeau.
                Les listes resteront privées et les réservations anonymes.
              </p>
            )}

             {isAdmin ? (
              <form
                action={async (fd) => {
                  await launchDraw(fd);                               // server action
                  startTransition(async () => {
                    const fresh = await fetchMyTarget(event.id);      // instant UI update
                    if (fresh) setTarget(fresh);
                    router.refresh();                                 // refresh RSC boundary
                    emitGlobalRefresh();                              // other tabs/pages
                  });
                }}
                className="mt-2"
              >
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="slug" value={slug} />
                <Button
                  type="submit"
                  disabled={membersCount < 2 || isPending}
                  title={membersCount < 2 ? "Au moins 2 participants requis" : hasDraw ? "Relancer" : "Lancer le tirage"}
                >
                  {isPending ? "…" : hasDraw ? "↻ Relancer" : "🎲 Lancer le tirage"}
                </Button>
              </form>
            ) : null}

            {/* résumé des paramètres cadeau, placé au-dessus des règles */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {typeof event.budgetCapCents === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                 <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
                  Budget max : {fmtEUR(event.budgetCapCents)}
                </span>
              )}
              {event.isSecondHandOk && (
                <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                  <Recycle className="h-3.5 w-3.5" aria-hidden="true" />
                  Seconde main acceptée
                </span>
              )}
              {event.isHandmadeOk && (
                <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                  <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                  Fait main accepté
                </span>
              )}
            </div>
          
            {/* Règles du tirage — titre + liste, visible pour tous */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border">?</span>
                Règles du tirage
              </div>
              <ul className="list-disc pl-6 text-sm text-[var(--muted-foreground)]">
                <li>Chaque participant offre un cadeau à une seule personne.</li>
                <li>Personne ne peut se tirer lui-même.</li>
                <li>La personne qui a créé l'événement peut relancer un tirage.</li>
              </ul>
            </div>
        </CardContent>
      </Card>

      {/* Ligne ~115: Participants — visibles même en SS. Pas de listes des autres. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <Users className="h-5 w-5" aria-hidden="true" />
              {membersCount}  Participants
            </span>
            {isAdmin ? <InviteMemberChip eventId={event.id} /> : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.lists.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {event.lists.map((l) => {
                  const isTarget = targetId === l.ownerId;
                  return (
                    <li
                      key={l.id}
                      aria-current={isTarget ? "true" : undefined}
                      className={[
                        "group flex items-center justify-between rounded-lg border px-3 py-2",
                        isTarget
                          ? "bg-[color-mix(in_oklch,var(--primary)_12%,white)] border-[color-mix(in_oklch,var(--primary)_35%,white)] ring-1 ring-[var(--primary)]/25"
                          : "",
                      ].join(" ")}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {isTarget ? (
                          <span
                            aria-hidden="true"
                            className="grid h-5 w-5 place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="h-5 w-5" aria-hidden="true" />
                        )}
                        <span className="truncate">{displayName(l.owner)}</span>
                        {isTarget ? <span className="sr-only"> — à gâter</span> : null}
                      </span>
                    
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {l.items.length} {l.items.length > 1 ? "idées" : "idée"}
                        </span>
                    
                        {canRemove(l.ownerId) ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                                title="Retirer ce participant"
                                aria-label="Retirer ce participant"
                              >
                                <UserMinus className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </AlertDialogTrigger>
                        
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Retirer ce participant ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {displayName(l.owner)} sera retiré de l’événement. Sa liste sera supprimée et ses
                                  réservations seront libérées. En Secret Santa, les attributions seront réajustées.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <form action={removeMember}>
                                  <input type="hidden" name="eventId" value={event.id} />
                                  <input type="hidden" name="userId" value={l.ownerId} />
                                  <input type="hidden" name="slug" value={slug} />
                                  <AlertDialogAction asChild>
                                    <Button type="submit" variant="destructive">Retirer</Button>
                                  </AlertDialogAction>
                                </form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">Aucun participant pour le moment.</p>
          )}
        </CardContent>
      </Card>

      {/* Ligne ~150: Ma liste + CTA d’ajout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Ma liste
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myList && myList.items.length > 0 ? (
            <ul className="space-y-1">
              {myList.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between border-b py-2 text-sm">
                  <span className="truncate">{it.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Ajoutez des idées de cadeaux. Vos invités verront la liste sans savoir qui vous a tiré au sort.
            </p>
          )}

          <Link
            href={`/event/${slug}/add`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[var(--primary)] py-3 font-medium text-[var(--primary-foreground)] transition hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]"
          >
            Ajouter un cadeau
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
