import type { EventGiftMode } from "@prisma/client";

export type GiftsOverviewStats = {
  myItemsCount: number;
  otherItemsCount: number;
  myReservationsCount: number;
};

export type GiftReservationView = {
  isReserved: boolean;
  isReservedByCurrentUser: boolean;
  reservedByName: string | null;
  reservedByNames: string[];
  hideReservationState: boolean;
};

export type GiftScreenItem = {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
  imagePath: string | null;
  isSuggestion: boolean;
  reservation: GiftReservationView;
};

export type GiftScreenParticipant = {
  id: string;
  name: string | null;
  email: string | null;
};

export type GiftScreenRelative = {
  id: string;
  firstName: string;
};

export type GiftScreenList = {
  id: string;
  title: string;
  ownerId: string | null;
  eventRelativeId: string | null;
  owner: GiftScreenParticipant | null;
  eventRelative: GiftScreenRelative | null;
  items: GiftScreenItem[];
};

export type GiftsScreenData = {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode | null;
  isConfigured: boolean;
  canConfigure: boolean;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  currentUserId: string;
  isEventOwner: boolean;
  isAdmin: boolean;
  hostList: GiftScreenList | null;
  myList: GiftScreenList | null;
  otherLists: GiftScreenList[];
};

export type EventGiftsScreenDataResult = {
  giftsStats: GiftsOverviewStats | null;
  screenData: GiftsScreenData | null;
};
