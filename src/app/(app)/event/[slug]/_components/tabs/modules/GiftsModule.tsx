import { EventGiftMode } from "@prisma/client";
import { GiftSection } from "../../../gifts/_components/gift-section";
import type { GiftListWithParticipantAndItems } from "../../../gifts/_components/types";

export type GiftsModuleProps = {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  currentUserId: string;
  isEventOwner: boolean;
  isAdmin: boolean;
  hostList: GiftListWithParticipantAndItems | null;
  myList: GiftListWithParticipantAndItems | null;
  otherLists: GiftListWithParticipantAndItems[];
};

export function GiftsModule({
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
  otherLists,
}: GiftsModuleProps) {
  return (
    <GiftSection
      eventId={eventId}
      slug={slug}
      giftMode={giftMode}
      isNoSpoil={isNoSpoil}
      isAnonReservations={isAnonReservations}
      currentUserId={currentUserId}
      isEventOwner={isEventOwner}
      isAdmin={isAdmin}
      hostList={hostList}
      myList={myList}
      otherLists={otherLists}
    />
  );
}
