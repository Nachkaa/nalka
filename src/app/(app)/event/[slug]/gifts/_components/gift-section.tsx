// app/(app)/event/[slug]/gifts/_components/gift-section.tsx

import { EventGiftMode } from "@prisma/client";
import { HostListSection } from "./host-list/host-list-section";
import { PersonalListsSection } from "./personal-lists/personal-lists-section";
import type { GiftListWithParticipantAndItems } from "./types";

type Props = {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  currentUserId: string;
  isEventOwner: boolean;
  isAdmin: boolean;
  hostList?: GiftListWithParticipantAndItems | null;
  myList?: GiftListWithParticipantAndItems | null;
  otherLists?: GiftListWithParticipantAndItems[];
};

export function GiftSection({
  eventId,
  slug,
  giftMode,
  isNoSpoil,
  isAnonReservations,
  currentUserId,
  isEventOwner,
  isAdmin,
  hostList,
  myList,
  otherLists = [],
}: Props) {
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
