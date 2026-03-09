// app/(app)/event/[slug]/gifts/_components/host-list/host-list-section.tsx

import { Button } from "@/components/ui/button";
import { ReservationStatus } from "@prisma/client";
import { Lightbulb, Plus } from "lucide-react";
import { deleteGift, reserveGift, unreserveGift } from "../../actions";
import { AddGiftButton } from "../shared/add-gift-button";
import { GiftItemCard } from "../shared/gift-item-card";
import { GiftIdeaDialog } from "../shared/GiftIdeaDialog";
import type { GiftListWithParticipantAndItems } from "../types";

type Props = {
  eventId: string;
  slug: string;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  currentUserId: string;
  isEventOwner: boolean;
  hostList: GiftListWithParticipantAndItems | null;
};

function displayName(u?: { name: string | null; email: string | null } | null) {
  if (!u) return "Quelqu'un";
  if (u.name && u.name.trim()) return u.name.trim().split(/\s+/)[0];
  return u.email ?? "Quelqu'un";
}

export function HostListSection({
  eventId,
  slug,
  isNoSpoil,
  isAnonReservations,
  currentUserId,  hostList,
}: Props) {
  if (!hostList) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <p className="font-medium">Aucune liste trouvée</p>
        <p className="mt-1 text-sm">La liste de cadeaux n&apos;a pas encore été créée.</p>
      </div>
    );
  }

  const isMyList = hostList.ownerId === currentUserId;
  const items = hostList.items ?? [];

  // “Pas de spoil” = sur MA liste, je ne vois pas l’état réservé
  const hideReservationState = isMyList && isNoSpoil;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {isMyList ? "Liste d'idées" : `Liste de ${hostList.owner?.name ?? "l'organisateur"}`}
          </h2>
        </div>

        {isMyList ? (
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
        ) : (
          <GiftIdeaDialog
            mode="suggest"
            eventId={eventId}
            slug={slug}
            targetListId={hostList.id}
            targetDisplayName={hostList.owner?.name ?? undefined}
            trigger={
              <Button variant="outline">
                <Lightbulb className="mr-2 h-4 w-4" />
                Suggérer une idée
              </Button>
            }
          />
        )}
      </div>

      {/* Empty */}
      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {isMyList
              ? "Tu n'as pas encore ajouté d'idées de cadeaux."
              : "La liste est vide pour le moment."}
          </p>
          {isMyList ? <AddGiftButton slug={slug} className="mt-4 inline-block" /> : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const activeReservations =
              item.reservations?.filter((r) => r.status !== ReservationStatus.RELEASED) ?? [];
            const activeReservation = activeReservations[0];

            const isReservedByMe = activeReservation?.byUserId === currentUserId;
            const isReservedVisible = !!activeReservation && !hideReservationState;

            const reservedByName =
              activeReservation && !isAnonReservations
                ? displayName(activeReservation.byUser)
                : null;

            const reservedByNames =
              isMyList && !hideReservationState && !isAnonReservations
                ? activeReservations.map((r) => displayName(r.byUser))
                : undefined;

            return (
              <GiftItemCard
                key={item.id}
                item={{
                  id: item.id,
                  title: item.title,
                  url: item.url ?? null,
                  note: item.note ?? null,
                  imagePath: item.imagePath ?? null,
                  isReserved: isReservedVisible,
                  isReservedByMe: !!activeReservation && isReservedByMe, // utile si tu affiches “Réservé par toi”
                  reservedByName,
                  reservedByNames,
                  hideReservationState,
                }}
                slug={slug}
                eventId={eventId}
                isMyList={isMyList}
                isAnonReservations={isAnonReservations}
                canReserve={!isMyList && !activeReservation}
                canUnreserve={!isMyList && !!activeReservation && isReservedByMe}
                onReserve={
                  !isMyList && !activeReservation
                    ? async () => {
                        "use server";
                        await reserveGift(eventId, slug, item.id);
                      }
                    : undefined
                }
                onUnreserve={
                  !isMyList && !!activeReservation && isReservedByMe
                    ? async () => {
                        "use server";
                        await unreserveGift(eventId, slug, item.id);
                      }
                    : undefined
                }
                deleteGift={isMyList ? deleteGift : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
