import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReservationStatus } from "@prisma/client";
import { Lightbulb, Plus } from "lucide-react";
import Link from "next/link";
import { InviteEmptyStateCTA } from "../../../_components/participants/AddEventMembers";
import { deleteGift, reserveGift, unreserveGift } from "../../actions";
import { GiftItemCard } from "../shared/gift-item-card";
import { GiftIdeaDialog } from "../shared/GiftIdeaDialog";
import type { GiftListWithParticipantAndItems } from "../types";

const STATUS_RELEASED: ReservationStatus = "RELEASED";

type Props = {
  eventId: string;
  slug: string;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  currentUserId: string;
  isAdmin: boolean;
  myList: GiftListWithParticipantAndItems | null;
  otherLists: GiftListWithParticipantAndItems[];
};

function displayName(u?: { name: string | null; email: string | null } | null) {
  if (!u) return "Inconnu";
  if (u.name && u.name.trim()) return u.name.trim().split(/\s+/)[0];
  return u.email ?? "Inconnu";
}

export function PersonalListsSection({
  eventId,
  slug,
  isNoSpoil,
  isAnonReservations,
  currentUserId,
  isAdmin,
  myList,
  otherLists,
}: Props) {
  const items = myList?.items ?? [];
  const ownItems = items.filter((item) => !item.isSuggestion);
  const suggestedItems = items.filter((item) => item.isSuggestion);

  const toCardVM = (item: (typeof items)[number], isMyList: boolean) => {
    const activeReservations = (item.reservations ?? []).filter(
      (r) => r.status !== STATUS_RELEASED,
    );
    const activeReservation = activeReservations[0] ?? null;

    const isReservedByMe = activeReservation?.byUserId === currentUserId;

    // Pas de spoil = sur ma liste uniquement : je masque complètement l’état "réservé"
    const hideReservationState = isMyList && isNoSpoil;

    // état réservé réellement affiché
    const isReserved = !!activeReservation && !hideReservationState;

    // identité du réservataire = UNIQUEMENT pilotée par isAnonReservations
    const reservedByName =
      activeReservation && !isAnonReservations ? displayName(activeReservation.byUser) : null;

    // sur ma liste, si pas de spoil => on ne montre rien du tout
    const safeReservedByName = hideReservationState ? null : reservedByName;

    // (optionnel) liste de noms réservataires (si tu as plusieurs réservations actives)
    const reservedByNames =
      isMyList && !hideReservationState && !isAnonReservations
        ? activeReservations.map((r) => displayName(r.byUser)).filter(Boolean)
        : undefined;

    return {
      id: item.id,
      title: item.title,
      url: item.url ?? null,
      note: item.note ?? null,
      imagePath: item.imagePath ?? null,
      isSuggestion: !!item.isSuggestion,

      // IMPORTANT: utiliser isReserved (pas !!activeReservation)
      isReserved,

      // IMPORTANT: si pas de spoil, "réservé par toi" ne doit pas apparaître non plus
      isReservedByMe: hideReservationState ? false : !!isReservedByMe,

      reservedByName: safeReservedByName,
      reservedByNames,

      // si tu as appliqué ma refacto GiftItemCard avec hideReservationState, tu peux l’ajouter ici :
      // hideReservationState,
    };
  };

  return (
    <div className="space-y-10">
      {/* Ma liste */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Ma liste</h2>

          <GiftIdeaDialog
            mode="create"
            eventId={eventId}
            slug={slug}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une idée
              </Button>
            }
          />
        </div>

        {ownItems.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ownItems.map((item) => (
              <GiftItemCard
                key={item.id}
                item={toCardVM(item, true)}
                slug={slug}
                eventId={eventId}
                isAnonReservations={isAnonReservations}
                isMyList
                canReserve={false}
                canUnreserve={false}
                deleteGift={deleteGift}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground rounded-xl border-2 border-dashed p-8 text-center text-sm">
            Ta liste est vide.
          </div>
        )}

        {suggestedItems.length > 0 ? (
          <div className="pt-2">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide">
              Idées proposées par d’autres participants :
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {suggestedItems.map((item) => (
                <GiftItemCard
                  key={item.id}
                  item={toCardVM(item, true)}
                  slug={slug}
                  eventId={eventId}
                  isAnonReservations={isAnonReservations}
                  isMyList
                  canReserve={false}
                  canUnreserve={false}
                  deleteGift={deleteGift}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Listes des autres participants (même pattern : header + CTA + grid, pas de Card géante) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Autres participants</h2>
        </div>

        {otherLists.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {otherLists.map((list) => {
              const name =
                list.eventRelative?.firstName ?? list.owner?.name ?? list.owner?.email ?? "Invité";

              const isEmail = name.includes("@");

              const label = (() => {
                if (!name) return "Invité";
                if (isEmail) return name.split("@")[0]; // partie avant @
                // premier mot (prénom)
                return name.trim().split(/\s+/)[0];
              })();

              const reservedCount = list.items.filter((it) =>
                it.reservations.some(
                  (r) => r.byUserId === currentUserId && r.status !== STATUS_RELEASED,
                ),
              ).length;

              const initials = (() => {
                if (!name) return "?";
                if (isEmail) {
                  const local = name.split("@")[0] ?? "";
                  const cleaned = local.replace(/[^a-zA-Z0-9]/g, "");
                  return (cleaned.slice(0, 2) || "?").toUpperCase();
                }
                const parts = name.trim().split(/\s+/).filter(Boolean);
                return (
                  parts
                    .slice(0, 2)
                    .map((p) => p[0]!.toUpperCase())
                    .join("") || "?"
                );
              })();

              return (
                <a
                  key={list.id}
                  href={`#p-${list.id}`}
                  className="group flex shrink-0 flex-col items-center gap-1 p-1"
                  title={name}
                >
                  <div
                    className={cn(
                      "bg-muted relative grid h-10 w-10 place-items-center rounded-full border text-xs font-semibold",
                      reservedCount > 0 && "ring-primary/35 bg-primary/5 ring-1",
                    )}
                  >
                    {initials}

                    {reservedCount > 0 ? (
                      <span className="bg-background text-primary absolute -right-1 -bottom-1 grid h-5 min-w-5 place-items-center rounded-full border px-1 text-[10px] font-medium">
                        {reservedCount}
                      </span>
                    ) : null}
                  </div>

                  {/* Libellé sous l’avatar */}
                  <span className="text-muted-foreground group-hover:text-foreground max-w-[64px] truncate text-[11px]">
                    {label}
                  </span>
                </a>
              );
            })}
          </div>
        ) : null}

        {otherLists.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-muted-foreground mb-4 text-sm">
              Invite des proches pour qu’ils ajoutent leurs listes.
            </p>
            {isAdmin ? <InviteEmptyStateCTA eventId={eventId} /> : null}
          </div>
        ) : (
          <div className="space-y-10">
            {otherLists.map((list) => {
              const ownerName =
                list.eventRelative?.firstName ?? list.owner?.name ?? list.owner?.email ?? "Invité";

              const anchorId = `p-${list.id}`;

              const getActiveReservation = (item: (typeof list.items)[number]) =>
                item.reservations.find((r) => r.status !== STATUS_RELEASED) ?? null;

              const sortedItems = [...list.items].sort((a, b) => {
                const ar = getActiveReservation(a);
                const br = getActiveReservation(b);

                const aReserved = !!ar;
                const bReserved = !!br;

                // 1) Dispo d'abord
                if (aReserved !== bReserved) return aReserved ? 1 : -1;

                // 2) (optionnel) parmi les réservés, "réservé par toi" juste avant les autres réservés
                const aMine = ar?.byUserId === currentUserId;
                const bMine = br?.byUserId === currentUserId;
                if (aReserved && bReserved && aMine !== bMine) return aMine ? -1 : 1;

                // 3) fallback alpha
                return a.title.localeCompare(b.title, "fr");
              });

              return (
                <section key={list.id} id={anchorId} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{ownerName}</h3>

                    <Button asChild variant="outline">
                      <Link href={`/event/${slug}/suggest/${list.id}`}>
                        <Lightbulb className="mr-2 h-4 w-4" />
                        Suggérer une idée
                      </Link>
                    </Button>
                  </div>

                  {sortedItems.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {sortedItems.map((item) => {
                        const activeReservation =
                          item.reservations.find((r) => r.status !== STATUS_RELEASED) ?? null;

                        const isReservedByMe = activeReservation?.byUserId === currentUserId;

                        const reservedByName =
                          activeReservation && !isAnonReservations
                            ? displayName(activeReservation.byUser)
                            : null;

                        return (
                          <GiftItemCard
                            key={item.id}
                            item={{
                              id: item.id,
                              title: item.title,
                              url: item.url ?? null,
                              note: item.note ?? null,
                              imagePath: item.imagePath ?? null,
                              isSuggestion: !!item.isSuggestion,
                              isReserved: !!activeReservation,
                              isReservedByMe,
                              reservedByName,
                              reservedByNames: undefined,
                            }}
                            slug={slug}
                            eventId={eventId}
                            isAnonReservations={isAnonReservations}
                            isMyList={false}
                            canReserve={!activeReservation}
                            canUnreserve={!!activeReservation && isReservedByMe}
                            onReserve={
                              !activeReservation
                                ? async () => {
                                    "use server";
                                    await reserveGift(eventId, slug, item.id);
                                  }
                                : undefined
                            }
                            onUnreserve={
                              activeReservation && isReservedByMe
                                ? async () => {
                                    "use server";
                                    await unreserveGift(eventId, slug, item.id);
                                  }
                                : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-muted-foreground rounded-xl border-2 border-dashed p-8 text-center text-sm">
                      Cette liste est vide.
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
