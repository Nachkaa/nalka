import type { EventRelative, GiftItem, GiftList, Reservation, User } from "@prisma/client";

export type GiftItemWithReservations = GiftItem & {
  reservations: (Reservation & { byUser: User | null })[];
  isSuggestion?: boolean;
};

export type GiftListWithParticipantAndItems = GiftList & {
  owner: User | null;
  eventRelative: EventRelative | null;
  items: GiftItemWithReservations[];
};
