import { InviteEmptyStateCTA } from "@/app/(app)/event/[slug]/_components/participants/AddEventMembers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  deleteGiftItem,
  reserveGiftItem,
  unreserveGiftItem,
} from "@/features/gifts/server/mutations";
import type { GiftScreenItem, GiftScreenList } from "@/features/gifts/types";
import { Lightbulb } from "lucide-react";
import Link from "next/link";

import { AddGiftButton } from "./AddGiftButton";
import { GiftItemCard } from "./GiftItemCard";

type Props = {
  eventId: string;
  slug: string;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  currentUserId: string;
  isAdmin: boolean;
  myList: GiftScreenList | null;
  otherLists: GiftScreenList[];
};

function toCardVM(item: GiftScreenItem) {
  return {
    id: item.id,
    title: item.title,
    url: item.url ?? null,
    note: item.note ?? null,
    imagePath: item.imagePath ?? null,
    isSuggestion: !!item.isSuggestion,
    isReserved: item.reservation.isReserved,
    isReservedByMe: item.reservation.isReservedByCurrentUser,
    reservedByName: item.reservation.reservedByName,
    reservedByNames: item.reservation.reservedByNames,
    hideReservationState: item.reservation.hideReservationState,
  };
}

export function PersonalListsSection({
  eventId,
  slug,
  isAnonReservations,
  isAdmin,
  myList,
  otherLists,
}: Props) {
  const items = myList?.items ?? [];
  const ownItems = items.filter((item) => !item.isSuggestion);
  const suggestedItems = items.filter((item) => item.isSuggestion);

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
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Ma liste</h2>

          <AddGiftButton eventId={eventId} slug={slug} />
        </div>

        {ownItems.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ownItems.map((item) => (
              <GiftItemCard
                key={item.id}
                item={toCardVM(item)}
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
            <p>Ta liste est vide.</p>
            <div className="mt-4">
              <AddGiftButton eventId={eventId} slug={slug} />
            </div>
          </div>
        )}

        {suggestedItems.length > 0 ? (
          <div className="pt-2">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide">
              Idées proposées par d&apos;autres participants :
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {suggestedItems.map((item) => (
                <GiftItemCard
                  key={item.id}
                  item={toCardVM(item)}
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
                if (isEmail) return name.split("@")[0];
                return name.trim().split(/\s+/)[0];
              })();

              const reservedCount = list.items.filter(
                (item) => item.reservation.isReservedByCurrentUser,
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
                    .map((part) => part[0]!.toUpperCase())
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
              Invite des proches pour qu&apos;ils ajoutent leurs listes.
            </p>
            {isAdmin ? <InviteEmptyStateCTA eventId={eventId} /> : null}
          </div>
        ) : (
          <div className="space-y-10">
            {otherLists.map((list) => {
              const ownerName =
                list.eventRelative?.firstName ?? list.owner?.name ?? list.owner?.email ?? "Invité";
              const anchorId = `p-${list.id}`;

              const sortedItems = [...list.items].sort((a, b) => {
                const aReserved = a.reservation.isReserved;
                const bReserved = b.reservation.isReserved;

                if (aReserved !== bReserved) return aReserved ? 1 : -1;

                const aMine = a.reservation.isReservedByCurrentUser;
                const bMine = b.reservation.isReservedByCurrentUser;
                if (aReserved && bReserved && aMine !== bMine) return aMine ? -1 : 1;

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
                      {sortedItems.map((item) => (
                        <GiftItemCard
                          key={item.id}
                          item={{
                            id: item.id,
                            title: item.title,
                            url: item.url ?? null,
                            note: item.note ?? null,
                            imagePath: item.imagePath ?? null,
                            isSuggestion: !!item.isSuggestion,
                            isReserved: item.reservation.isReserved,
                            isReservedByMe: item.reservation.isReservedByCurrentUser,
                            reservedByName: item.reservation.reservedByName,
                            reservedByNames: undefined,
                            hideReservationState: item.reservation.hideReservationState,
                          }}
                          slug={slug}
                          eventId={eventId}
                          isAnonReservations={isAnonReservations}
                          isMyList={false}
                          canReserve={!item.reservation.isReserved}
                          canUnreserve={item.reservation.isReservedByCurrentUser}
                          onReserve={
                            !item.reservation.isReserved
                              ? async () => {
                                  "use server";
                                  await reserveGiftItem({ eventId, slug, itemId: item.id });
                                }
                              : undefined
                          }
                          onUnreserve={
                            item.reservation.isReservedByCurrentUser
                              ? async () => {
                                  "use server";
                                  await unreserveGiftItem({ eventId, slug, itemId: item.id });
                                }
                              : undefined
                          }
                        />
                      ))}
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
