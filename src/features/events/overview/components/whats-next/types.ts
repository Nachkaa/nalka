import type { EventPollVM } from "@/features/polls/types";
import type {
  EventGiftMode,
  EventLocationMode,
  EventMemberRole,
  EventPollType,
  EventRsvpStatus,
  EventScheduleMode,
} from "@prisma/client";

export type WhatsNextItemStatus = "todo" | "info" | "ok";
export type WhatsNextIconKey =
  | "rsvp"
  | "date"
  | "success"
  | "location"
  | "description"
  | "poll"
  | "gifts"
  | "potluck"
  | "expenses";

export type WhatsNextItem = {
  key: string;
  order: number;
  title: string;
  description: string;
  status?: WhatsNextItemStatus;
  statusLabel?: string;
  icon?: WhatsNextIconKey;
  targetTab?: string;
  meta?: {
    pollId?: string;
    pollType?: EventPollType;
  };
};

export type WhatsNextInput = {
  eventDate: string | null;
  location: string | null;
  description: string | null;
  polls: EventPollVM[];
  role: EventMemberRole;
  canEditEvent: boolean;
  rsvpRequired: boolean;
  myRsvpStatus: EventRsvpStatus;
  scheduleMode: EventScheduleMode;
  locationMode: EventLocationMode;
  modules: {
    gifts: boolean;
    potluck: boolean;
    expenses: boolean;
  };
  giftMode: EventGiftMode;
  giftsStats?: {
    myItemsCount: number;
    otherItemsCount: number;
    myReservationsCount: number;
  };
  potluckStats?: {
    totalItems: number;
    myClaims: number;
  };
};

export type WhatsNextClickHandler = (item: WhatsNextItem) => void;
