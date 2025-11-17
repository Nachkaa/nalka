  import { auth } from "@/auth";
  import { prisma } from "@/lib/prisma";
  import {
    ReservationStatus as RS,
    EventMemberRole as ER,
    EventGiftMode as EGM,
  } from "@prisma/client";
  import InviteMemberChip from "./InviteMemberChip";
  import { deleteGift, removeMember } from "./actions";
  import { InviteEmptyStateCTA } from "./AddEventMembers";
  import { notFound } from "next/navigation";
  import Link from "next/link";
  import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  import { Gift, Lock, Pencil, Trash2, ArrowLeft, Calendar, MapPin, EyeOff, Recycle, Hammer, UserMinus, Link2, CheckCircle2, Info } from "lucide-react";
  import GiftListAnimated, { GiftItemVM } from "./GiftListAnimated";
  import LeaveEventDialog from "./LeaveEventDialog";
  import SecretSantaExperience from "./SecretSantaExperience";
  import { InviteShareDialog } from "./InviteShareDialog";
  import { requireEventForUser } from "@/features/events/permissions";
  import ExpandableText from "@/components/ui/expandable-text";
  import { GiftImagePreview } from "@/components/gifts/GiftImagePreview";
  import { FinalizeGiftListDialog } from "./FinalizeGiftListDialog";

  export const runtime = "nodejs";
  export const dynamic = "force-dynamic";


  type PageProps = { params: Promise<{ slug?: string }> };
  const STATUS = RS;
  const ROLE = ER;
  const MODE = EGM;

  export default async function EventPage({ params }: PageProps) {
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

    const isAdmin = event.memberships.some(
      (m) => m.userId === meId && (m.role === ROLE.ADMIN || m.role === ROLE.OWNER),
    );

    const roleByUser = new Map(event.memberships.map(m => [m.userId, m.role]));
    const myRole = roleByUser.get(meId);
    const canRemove = (targetUserId: string) => {
      const targetRole = roleByUser.get(targetUserId);
      if (!myRole || !targetRole) return false;
      if (myRole === "OWNER") return targetUserId !== meId;
      if (myRole === "ADMIN") return targetRole === "MEMBER";
      return false;
    };

    if (event.giftMode === MODE.SECRET_SANTA) {
      return (
        <SecretSantaExperience
          event={event}
          meId={meId}
          slug={slug}
          isAdmin={isAdmin}
        />
      );
    }

    const myList = event.lists.find((l) => l.ownerId === meId) ?? null;
    const otherLists = event.lists.filter((l) => l.ownerId !== meId);

    const showBudget =
      event.hasGifts &&
      event.giftMode !== MODE.HOST_LIST &&
      typeof event.budgetCapCents === "number";

    const displayName = (u?: { name: string | null; email: string | null } | null) => {
      if (!u) return "Inconnu";
      if (u.name && u.name.trim()) return u.name.trim().split(/\s+/)[0]; // prénom
      return u.email ?? "Inconnu";
    };

    const fmtDate = (d?: Date | null) =>
      d ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d) : null;

    const fmtEUR = (cents?: number | null) =>
      typeof cents === "number" ? (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }) : null;

    return (
      <main className="space-y-8 p-0">
        {/* Barre de retour uniquement */}
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/event" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Revenir à mes événements
            </Link>
          </Button>
        </nav>
       <header className="mb-4">
          {/* Mobile = grid rows; Desktop = flex row */}
          <div className="grid gap-3 md:flex md:items-start md:justify-between">
            {/* Title row */}
            <div className="grid grid-cols-[auto_1fr] items-start gap-2">
              {/* keep/remove this emoji span as you like */}
              <h1 className="min-w-0 break-words text-pretty text-2xl font-bold leading-tight md:text-3xl">
                {event.title}
              </h1>
            </div>

            {/* Actions row on mobile, right side on desktop */}
            <div className="flex flex-wrap gap-2 md:items-center">
              {/* compact buttons on mobile */}
              <div className="contents [&>button]:h-8 [&>button]:px-2 [&>button]:text-xs md:[&>button]:h-9 md:[&>button]:px-3 md:[&>button]:text-sm">
                {isAdmin && (
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
                )}
              </div>
            </div>
          </div>
        </header>
        <section aria-labelledby="event-meta" className="space-y-3">
        {event.description && (
          <p className="max-w-prose text-[var(--muted-foreground)]">{event.description}</p>
        )}

        <div id="event-meta" className="flex flex-wrap items-center gap-2 text-sm">
          {event.eventOn && (
            <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {fmtDate(event.eventOn)}
            </span>
          )}
          {event.location && (
            <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {event.location}
            </span>
          )}
          {showBudget && (
            <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1">
              Budget max par cadeau : {fmtEUR(event.budgetCapCents)}
            </span>
          )}
        </div>

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
       </section>

        {/* Ma liste */}
        {event.hasGifts && myList && (
        <Card>
          <CardHeader className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Ma liste</CardTitle>
              
              {myList.isFinalized ? (
                <>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Ta liste est finalisée. Tu peux encore faire des changements si besoin.</span>
                </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Tu peux ajouter ou modifier tes idées. Quand tu es prêt, valide ta liste
                  pour que les autres sachent qu’ils peuvent réserver en confiance.
                </p>
              )}
            </div>
            
            {myList.isFinalized ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                
              </span>
            ) : (
              <FinalizeGiftListDialog eventId={event.id} />
            )}
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-1">
              {(myList.items ?? []).map((item) => {
                const activeRes = (item.reservations ?? []).filter(
                  (r) => r.status !== STATUS.RELEASED
                );
                const isNoSpoil = event.isNoSpoil;
                const hasActive = activeRes.length > 0;
                const isFinalized = !!myList.isFinalized;
                const showSpoil = !isNoSpoil && hasActive;
                const dim = !event.isNoSpoil && hasActive;
              
                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 border-b py-3 text-sm md:flex-row md:items-start md:justify-between"
                  >
                    {/* Image + texte */}
                    <div className="flex min-w-0 flex-1 gap-3">
                      {item.imagePath && (
                        <GiftImagePreview
                          src={item.imagePath}
                          alt={item.title}
                          sizeClassName="h-24 w-24"
                        />
                      )}
      
                      <div className="min-w-0 flex-1">
                        {/* titre + lock + chip lien sur une ligne */}
                        <div className="flex items-center gap-2">
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
                          </div>
                        
                          {/* chip lien si présent */}
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
                        
                        
                        {/* description sous le titre */}
                        {item.note && (
                          <ExpandableText
                            text={item.note}
                            maxLines={4}
                            className="mt-1 text-xs"
                          />
                        )}
      
                        {/* info réservation si spoil autorisé */}
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
                        
                    {/* Actions à droite */}
                  <div className="mt-1 flex items-center justify-end gap-2 md:mt-0 md:flex-shrink-0">
                  {/* ÉDITION */}
                      {!isFinalized ? (
                        // Avant validation : édition directe
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
                        // Après validation + no-spoil : on ne sait PAS si c'est réservé
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
                                    Ta liste est finalisée. Modifier ce cadeau peut impacter
                                    quelqu’un qui avait prévu de te l’offrir.
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
                                  <Button variant="outline">Continuer</Button>
                                </Link>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : hasActive ? (
                        // Après validation + spoil + déjà réservé : on peut le dire clairement
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
                              <AlertDialogTitle>Ce cadeau est déjà réservé</AlertDialogTitle>
                              <AlertDialogDescription asChild>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                  <p>
                                    Modifier ces informations peut impacter la personne qui te
                                    l’offrira.
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
                      ) : (
                        // Après validation + spoil + pas réservé : édition directe
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
                      )}
                    
                      {/* SUPPRESSION */}
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
                              {!isFinalized
                                ? "Supprimer ce cadeau ?"
                                : isNoSpoil
                                ? "Retirer ce cadeau ?"
                                : hasActive
                                ? "Ce cadeau est réservé"
                                : "Supprimer ce cadeau ?"}
                            </AlertDialogTitle>
                              
                            <AlertDialogDescription asChild>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                {/* Avant finalisation : simple confirmation anti-missclick */}
                                {!isFinalized && (
                                  <p>
                                    « {item.title} » sera retiré de ta liste.
                                  </p>
                                )}
                    
                                {/* Après finalisation + no-spoil : on reste en mode "peut-être réservé" */}
                                {isFinalized && isNoSpoil && (
                                  <>
                                    <p>
                                      Tu veux vraiment retirer « {item.title} » de ta liste&nbsp;?
                                    </p>
                                    <p>
                                      Si quelqu’un l’a déjà réservé, il sera prévenu et pourra
                                      choisir autre chose.
                                    </p>
                                  </>
                                )}
                    
                                {/* Après finalisation + spoil + déjà réservé */}
                                {isFinalized && !isNoSpoil && hasActive && (
                                  <>
                                    <p>
                                      Tu veux retirer « {item.title} » de ta liste&nbsp;?
                                    </p>
                                    <p>
                                      La personne qui l’avait réservé sera prévenue et pourra
                                      choisir autre chose.
                                    </p>
                                  </>
                                )}
                    
                                {/* Après finalisation + spoil + pas réservé */}
                                {isFinalized && !isNoSpoil && !hasActive && (
                                  <p>
                                    « {item.title} » sera retiré de ta liste.
                                  </p>
                                )}
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                              
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <form action={deleteGift}>
                              <input type="hidden" name="itemId" value={item.id} />
                              <input type="hidden" name="eventId" value={event.id} />
                              <AlertDialogAction asChild>
                                <Button type="submit" variant="destructive">
                                  {isFinalized ? "Retirer de ma liste" : "Supprimer"}
                                </Button>
                              </AlertDialogAction>
                            </form>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                  </li>
                );
              })}
      
              <Link
                href={`/event/${slug}/add`}
                className="mt-4 block rounded-lg bg-[var(--primary)] py-3 text-center font-medium text-[var(--primary-foreground)] transition hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]"
              >
                Ajouter un cadeau
              </Link>
            </ul>
          </CardContent>
        </Card>
      )}
        

        {/* Participants et listes */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Listes des autres participants</h2>
          </div>

          {/* chips */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {isAdmin && <InviteMemberChip eventId={event.id} />}

            {otherLists.map((list) => {
              const reservedCount = list.items.filter((i) =>
                i.reservations.some((r) => r.byUserId === meId && r.status === STATUS.RESERVED),
              ).length;

              const hasMine = reservedCount > 0;
              const name = list.owner.name ?? list.owner.email?.split("@")[0] ?? "Inconnu";
              const label = hasMine
                ? `${reservedCount} ${reservedCount > 1 ? "cadeaux" : "cadeau"} réservé(s) chez ${name}`
                : `Aucun cadeau réservé chez ${name}`;

              const initials = (list.owner.name ?? list.owner.email ?? "?")
                .split(/[^\p{L}\p{N}]+/u)
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0])
                .join("")
                .toUpperCase();            

              return (
                <div key={`chip-${list.id}`} className="flex w-16 flex-col items-center">
                  <a
                    href={`#list-${list.id}`}
                    className={`relative inline-flex h-12 w-12 select-none items-center justify-center rounded-full ring-1 ring-[var(--border)]
                      ${
                        hasMine
                          ? "ring-2 ring-[var(--primary)] bg-[color-mix(in_oklch,var(--primary),white_88%)]"
                          : "bg-[var(--secondary)]"
                      }
                      transition-transform hover:scale-[1.03]`}
                    title={label}
                    aria-label={label}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        hasMine ? "text-[var(--foreground)]" : "text-[var(--sidebar-primary)]"
                      }`}
                    >
                      {initials}
                    </span>

                    {hasMine && (
                      <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-xs font-medium text-[var(--primary-foreground)] shadow">
                        <Gift className="h-3 w-3" />
                        {reservedCount}
                      </span>
                    )}
                  </a>
                  <span className="mt-1 w-full truncate text-center text-xs text-[var(--muted-foreground)]">
                    {name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* lists */}
          {otherLists.map((list) => {
            const rank = (it: (typeof list.items)[number]) => {
              const taken = it.reservations.some((r) => r.status !== STATUS.RELEASED);
              const mine = it.reservations.some((r) => r.byUserId === meId && r.status === STATUS.RESERVED);
              return mine ? 0 : taken ? 2 : 1;
            };

            const hasMine = list.items.some((i) =>
              i.reservations.some((r) => r.byUserId === meId && r.status === STATUS.RESERVED),
            );
            const reservedCount = list.items.filter((i) =>
              i.reservations.some((r) => r.byUserId === meId && r.status === STATUS.RESERVED),
            ).length;

            const sortedItems = [...list.items].sort((a, b) => {
              const diff = rank(a) - rank(b);
              return diff !== 0 ? diff : a.title.localeCompare(b.title, "fr");
            });

            const itemsVM: GiftItemVM[] = sortedItems.map((item) => {
            const my = item.reservations.find((r) => r.byUserId === meId && r.status === STATUS.RESERVED);
            const other = item.reservations.find((r) => r.byUserId !== meId && r.status === STATUS.RESERVED);

            return {
              id: item.id,
              title: item.title,
              url: item.url ?? null,
              note: item.note ?? null,
              isMine: !!my,
              isTakenByOther: !!other,
              imagePath: item.imagePath ?? null,
              reservedByName: !event.isAnonReservations && other?.byUser
                ? displayName(other.byUser)
                : null,
            };
          });

            return (
              <Card
                key={list.id}
                id={`list-${list.id}`}
                className={hasMine ? "ring-1 ring-[var(--primary)] border-[var(--primary)]" : ""}
              >
                <CardHeader className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{list.owner.name ?? list.owner.email}</CardTitle>

                      {list.isFinalized && (
                        <span className="inline-flex items-center gap-1 rounded-full
                          border border-[var(--border)] px-2 py-0.5
                          text-[10px] font-medium text-[var(--muted-foreground)]">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          Finalisée
                        </span>
                      )}
                    </div>
                    
                    {reservedCount > 0 && (
                      <p className="text-sm font-medium text-[var(--primary)]">
                        🎁 {reservedCount} {reservedCount > 1 ? "cadeaux réservés" : "cadeau réservé"}
                      </p>
                    )}
                  </div>
                  
                  {isAdmin && canRemove(list.ownerId) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Retirer ce participant"
                          aria-label="Retirer ce participant">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                  
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Retirer ce participant ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {list.owner.name ?? list.owner.email} sera retiré de l’événement. Sa liste sera supprimée et ses
                            réservations seront libérées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <form action={removeMember}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <input type="hidden" name="userId" value={list.ownerId} />
                            <input type="hidden" name="slug" value={slug} />
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
                </CardHeader>
                <CardContent>
                  <GiftListAnimated items={itemsVM} eventId={event.id} showNames={!event.isAnonReservations}/>
                </CardContent>
              </Card>
            );
          })}

          {otherLists.length === 0 && (
            <div className="rounded-lg border p-6 text-center">
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">
                Invitez vos proches pour qu’ils ajoutent leurs listes.
              </p>
              {isAdmin && <InviteEmptyStateCTA eventId={event.id} />}
            </div>
          )}
        </section>
        {/* Danger zone: quitter l’événement */}
        {!isAdmin && (
        <section
          aria-labelledby="leave-event-heading"
          className="mt-12 border-t pt-8"
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <h2
              id="leave-event-heading"
              className="text-sm font-semibold text-foreground"
            >
              Ne plus participer à cet événement
            </h2>
            <p>
              Vous pourrez toujours être réinvité plus tard par l’organisateur.
            </p>
            <LeaveEventDialog eventId={event.id} />
          </div>
        </section>
      )}
      </main>
    );
  }
