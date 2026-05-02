import { Button } from "@/components/ui/button";
import {
  deleteGiftItem,
  reserveGiftItem,
  unreserveGiftItem,
} from "@/features/gifts/server/mutations";
import type { GiftScreenList } from "@/features/gifts/types";
import { Lightbulb } from "lucide-react";

import { AddGiftButton } from "./AddGiftButton";
import { GiftIdeaDialog } from "./GiftIdeaDialog";
import { GiftItemCard } from "./GiftItemCard";

type Props = {
  eventId: string;
  slug: string;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  currentUserId: string;
  isEventOwner: boolean;
  hostList: GiftScreenList | null;
};

export function HostListSection({
  eventId,
  slug,
  isAnonReservations,
  currentUserId,
  hostList,
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

  async function deleteGift(formData: FormData) {
    "use server";

    const itemId = formData.get("itemId")?.toString();
    const currentEventId = formData.get("eventId")?.toString();

    if (!itemId || !currentEventId) {
      throw new Error("Paramètres manquants");
    }

    await deleteGiftItem({ eventId: currentEventId, itemId });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {isMyList ? "Liste d'idées" : `Liste de ${hostList.owner?.name ?? "l'organisateur"}`}
          </h2>
        </div>

        {isMyList ? (
          <AddGiftButton eventId={eventId} slug={slug} />
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

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {isMyList
              ? "Tu n'as pas encore ajouté d'idées de cadeaux."
              : "La liste est vide pour le moment."}
          </p>
          {isMyList ? (
            <AddGiftButton eventId={eventId} slug={slug} className="mt-4 inline-flex" />
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <GiftItemCard
              key={item.id}
              item={{
                id: item.id,
                title: item.title,
                url: item.url ?? null,
                note: item.note ?? null,
                imagePath: item.imagePath ?? null,
                isReserved: item.reservation.isReserved,
                isReservedByMe: item.reservation.isReservedByCurrentUser,
                reservedByName: item.reservation.reservedByName,
                reservedByNames: item.reservation.reservedByNames,
                hideReservationState: item.reservation.hideReservationState,
              }}
              slug={slug}
              eventId={eventId}
              isMyList={isMyList}
              isAnonReservations={isAnonReservations}
              canReserve={!isMyList && !item.reservation.isReserved}
              canUnreserve={!isMyList && item.reservation.isReservedByCurrentUser}
              onReserve={
                !isMyList && !item.reservation.isReserved
                  ? async () => {
                      "use server";
                      await reserveGiftItem({ eventId, slug, itemId: item.id });
                    }
                  : undefined
              }
              onUnreserve={
                !isMyList && item.reservation.isReservedByCurrentUser
                  ? async () => {
                      "use server";
                      await unreserveGiftItem({ eventId, slug, itemId: item.id });
                    }
                  : undefined
              }
              deleteGift={isMyList ? deleteGift : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
