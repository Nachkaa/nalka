import { EventGiftMode } from "@prisma/client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { GiftsScreenData } from "@/features/gifts/types";

import { HostListSection } from "./HostListSection";
import { PersonalListsSection } from "./PersonalListsSection";

export function GiftsScreen({
  eventId,
  slug,
  giftMode,
  isConfigured,
  canConfigure,
  isNoSpoil,
  isAnonReservations,
  currentUserId,
  isEventOwner,
  isAdmin,
  hostList,
  myList,
  otherLists = [],
}: GiftsScreenData) {
  if (!isConfigured || giftMode === null) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Configuration des cadeaux requise</h2>
            <p className="mt-1 text-sm text-amber-900/90">
              Le module Cadeaux est activé, mais le mode de liste n&apos;a pas encore été choisi.
            </p>
          </div>

          {canConfigure ? (
            <div className="space-y-2">
              <p className="text-sm">
                Choisissez explicitement un mode avant d&apos;utiliser le module :
                une liste partagée ou une liste par participant.
              </p>
              <Button asChild>
                <Link href={`/event/${slug}/gifts?configure=gifts`}>Configurer les cadeaux</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-amber-900/90">
              L&apos;organisateur doit terminer la configuration avant que les cadeaux soient
              disponibles.
            </p>
          )}
        </div>
      </div>
    );
  }

  switch (giftMode) {
    case EventGiftMode.HOST_LIST:
      return (
        <HostListSection
          eventId={eventId}
          slug={slug}
          isNoSpoil={isNoSpoil}
          isAnonReservations={isAnonReservations}
          currentUserId={currentUserId}
          isEventOwner={isEventOwner}
          hostList={hostList ?? null}
        />
      );

    case EventGiftMode.PERSONAL_LISTS:
      return (
        <PersonalListsSection
          eventId={eventId}
          slug={slug}
          isNoSpoil={isNoSpoil}
          isAnonReservations={isAnonReservations}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          myList={myList ?? null}
          otherLists={otherLists}
        />
      );

    default:
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Mode de cadeaux non reconnu</p>
        </div>
      );
  }
}
