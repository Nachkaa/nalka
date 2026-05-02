import type { EventPollVM } from "@/features/polls/types";
import type {
  EventGiftMode,
  EventLocationMode,
  EventMemberRole,
  EventPollStatus,
  EventRsvpStatus,
  EventScheduleMode,
  EventTimelineMomentKind,
} from "@prisma/client";

import type { EventShellNavItem } from "@/features/events/shell-navigation";

export type RsvpSummary = {
  going: number;
  maybe: number;
  notGoing: number;
  pending: number;
};

export type OverviewPollsProps = {
  polls: EventPollVM[];
  totalMembers: number;
  canEdit: boolean;
  meId: string;
};

export type GiftsStats = {
  myItemsCount: number;
  otherItemsCount: number;
  myReservationsCount: number;
};

export type PotluckStats = {
  totalItems: number;
  myClaims: number;
};

export type ProgrammeSummary = {
  status: "En cours" | "À venir";
  title: string;
  startsAt: string;
  endsAt: string | null;
  locationName?: string | null;
  note?: string | null;
  next?:
    | {
        title: string;
        startsAt: string;
        endsAt: string | null;
      }
    | null;
};

export type ProgrammeLiveMoment = {
  id: string;
  title: string;
  kind: EventTimelineMomentKind;
  startsAt: string;
  endsAt: string | null;
  locationName: string | null;
  locationAddress: string | null;
  note: string | null;
  position: number;
};

export type ProgrammeLiveData = {
  currentMoment: ProgrammeLiveMoment | null;
  nextMoment: ProgrammeLiveMoment | null;
  hasPastMoments: boolean;
  programmeStatus: "empty" | "upcoming" | "current" | "completed";
};

export type OverviewModuleProps = {
  eventTitle: string;
  eventDate: string | null;
  location: string | null;
  rsvpSummary: RsvpSummary;
  participantsCount: number;
  pollsProps?: OverviewPollsProps;
  eventId: string;
  showLeaveSection: boolean;
  eventSlug: string;
  description: string | null;
  canEditDescription: boolean;
  navigation: EventShellNavItem[];
  rsvpRequired: boolean;
  myRsvpStatus: EventRsvpStatus;
  canEditEvent: boolean;
  userRole: EventMemberRole;
  scheduleMode: EventScheduleMode;
  locationMode: EventLocationMode;
  giftMode: EventGiftMode;
  giftsStats?: GiftsStats;
  potluckStats?: PotluckStats;
  programmeSummary?: ProgrammeSummary | null;
  programmeLive?: ProgrammeLiveData;
};

export type UpdateRsvpAction = (input: {
  eventId: string;
  status: EventRsvpStatus;
}) => Promise<{ ok: boolean; error?: string }>;

export type UpdateDescriptionAction = (
  eventId: string,
  slug: string,
  description: string | null,
) => Promise<{ success: boolean; error?: string }>;

export type LeaveEventAction = (formData: FormData) => Promise<void>;

export type EnableRsvpRequirementAction = (params: {
  eventId: string;
  slug: string;
}) => Promise<{ ok: boolean; error?: string }>;

export const OPEN_POLL_ORDER: Record<EventPollStatus extends never ? never : string, number> = {
  SCHEDULE: 0,
  LOCATION: 1,
};
