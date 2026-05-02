import { EventGiftMode, ReservationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { getGiftParticipantDisplayName } from "../../lib/gifts-screen-mappers";
import type {
  EventGiftsScreenDataResult,
  GiftScreenItem,
  GiftScreenList,
  GiftsOverviewStats,
  GiftsScreenData,
} from "../../types";

type GetEventGiftsScreenDataParams = {
  eventId: string;
  slug: string;
  currentUserId: string;
  eventOwnerId: string;
  giftMode: EventGiftMode;
  isConfigured: boolean;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  isAdmin: boolean;
  giftsModuleEnabled: boolean;
  includeScreenData: boolean;
};

function mapGiftItem(
  item: {
    id: string;
    title: string;
    url: string | null;
    note: string | null;
    imagePath: string | null;
    isSuggestion: boolean;
    reservations: Array<{
      byUserId: string;
      byUser: {
        name: string | null;
        email: string | null;
      } | null;
    }>;
  },
  options: {
    currentUserId: string;
    isMyList: boolean;
    isNoSpoil: boolean;
    isAnonReservations: boolean;
  },
): GiftScreenItem {
  const hideReservationState = options.isMyList && options.isNoSpoil;
  const activeReservation = item.reservations[0] ?? null;
  const isReservedByCurrentUser = activeReservation?.byUserId === options.currentUserId;

  return {
    id: item.id,
    title: item.title,
    url: item.url,
    note: item.note,
    imagePath: item.imagePath,
    isSuggestion: item.isSuggestion,
    reservation: {
      isReserved: !hideReservationState && item.reservations.length > 0,
      isReservedByCurrentUser: hideReservationState ? false : !!isReservedByCurrentUser,
      reservedByName:
        hideReservationState || options.isAnonReservations || !activeReservation
          ? null
          : getGiftParticipantDisplayName(activeReservation.byUser),
      reservedByNames:
        hideReservationState || options.isAnonReservations
          ? []
          : item.reservations.map((reservation) =>
              getGiftParticipantDisplayName(reservation.byUser),
            ),
      hideReservationState,
    },
  };
}

function mapGiftList(
  list: {
    id: string;
    title: string;
    ownerId: string | null;
    eventRelativeId: string | null;
    owner: {
      id: string;
      name: string | null;
      email: string | null;
    } | null;
    eventRelative: {
      id: string;
      firstName: string;
    } | null;
    items: Array<{
      id: string;
      title: string;
      url: string | null;
      note: string | null;
      imagePath: string | null;
      isSuggestion: boolean;
      reservations: Array<{
        byUserId: string;
        byUser: {
          name: string | null;
          email: string | null;
        } | null;
      }>;
    }>;
  },
  options: {
    currentUserId: string;
    isNoSpoil: boolean;
    isAnonReservations: boolean;
  },
): GiftScreenList {
  const isMyList = list.ownerId === options.currentUserId && list.eventRelativeId === null;

  return {
    id: list.id,
    title: list.title,
    ownerId: list.ownerId,
    eventRelativeId: list.eventRelativeId,
    owner: list.owner,
    eventRelative: list.eventRelative,
    items: list.items.map((item) =>
      mapGiftItem(item, {
        currentUserId: options.currentUserId,
        isMyList,
        isNoSpoil: options.isNoSpoil,
        isAnonReservations: options.isAnonReservations,
      }),
    ),
  };
}

export async function getEventGiftsScreenData({
  eventId,
  slug,
  currentUserId,
  eventOwnerId,
  giftMode,
  isConfigured,
  isNoSpoil,
  isAnonReservations,
  isAdmin,
  giftsModuleEnabled,
  includeScreenData,
}: GetEventGiftsScreenDataParams): Promise<EventGiftsScreenDataResult> {
  let giftsStats: GiftsOverviewStats | null = null;

  if (giftsModuleEnabled && isConfigured) {
    const [myItemsCount, otherItemsCount, myReservationsCount] = await Promise.all([
      prisma.giftItem.count({
        where: {
          list: {
            eventId,
            ownerId: currentUserId,
          },
        },
      }),
      prisma.giftItem.count({
        where: {
          list: {
            eventId,
            ownerId: { not: currentUserId },
          },
        },
      }),
      prisma.reservation.count({
        where: {
          byUserId: currentUserId,
          status: { not: ReservationStatus.RELEASED },
          item: {
            list: {
              eventId,
            },
          },
        },
      }),
    ]);

    giftsStats = { myItemsCount, otherItemsCount, myReservationsCount };
  }

  if (!includeScreenData) {
    return { giftsStats, screenData: null };
  }

  if (!giftsModuleEnabled) {
    return { giftsStats, screenData: null };
  }

  if (!isConfigured) {
    return {
      giftsStats,
      screenData: {
        eventId,
        slug,
        giftMode: null,
        isConfigured: false,
        canConfigure: isAdmin,
        isNoSpoil,
        isAnonReservations,
        currentUserId,
        isEventOwner: eventOwnerId === currentUserId,
        isAdmin,
        hostList: null,
        myList: null,
        otherLists: [],
      },
    };
  }

  const rawLists = await prisma.giftList.findMany({
    where: { eventId },
    select: {
      id: true,
      title: true,
      ownerId: true,
      eventRelativeId: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      eventRelative: {
        select: {
          id: true,
          firstName: true,
        },
      },
      items: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          url: true,
          note: true,
          imagePath: true,
          isSuggestion: true,
          reservations: {
            where: { status: { not: ReservationStatus.RELEASED } },
            orderBy: { createdAt: "asc" },
            select: {
              byUserId: true,
              byUser: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const mappedLists = rawLists.map((list) =>
    mapGiftList(list, {
      currentUserId,
      isNoSpoil,
      isAnonReservations,
    }),
  );

  const hostList =
    mappedLists.find((list) => list.ownerId === eventOwnerId && list.eventRelativeId === null) ??
    null;
  const myList =
    mappedLists.find((list) => list.ownerId === currentUserId && list.eventRelativeId === null) ??
    null;

  const otherLists =
    giftMode === EventGiftMode.HOST_LIST && hostList
      ? currentUserId === eventOwnerId
        ? []
        : [hostList]
      : mappedLists.filter(
          (list) => !(list.ownerId === currentUserId && list.eventRelativeId === null),
        );

  const screenData: GiftsScreenData = {
    eventId,
    slug,
    giftMode,
    isConfigured: true,
    canConfigure: isAdmin,
    isNoSpoil,
    isAnonReservations,
    currentUserId,
    isEventOwner: eventOwnerId === currentUserId,
    isAdmin,
    hostList,
    myList,
    otherLists,
  };

  return {
    giftsStats,
    screenData,
  };
}
