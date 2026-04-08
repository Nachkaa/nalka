import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import { EventTimelineMomentKind } from "@prisma/client";

export type ProgrammeLiveData = {
  currentMoment: {
    id: string;
    title: string;
    kind: EventTimelineMomentKind;
    startsAt: string;
    endsAt: string | null;
    locationName: string | null;
    locationAddress: string | null;
    note: string | null;
    position: number;
  } | null;
  nextMoment: {
    id: string;
    title: string;
    kind: EventTimelineMomentKind;
    startsAt: string;
    endsAt: string | null;
    locationName: string | null;
    locationAddress: string | null;
    note: string | null;
    position: number;
  } | null;
  hasPastMoments: boolean;
  programmeStatus: "empty" | "upcoming" | "current" | "completed";
};

export type TimelineModuleProps = {
  eventId: string;
  slug: string;
  canEdit: boolean;
  meId: string;
  eventDate: string | null;
  eventTitle: string;
  schedulePoll?: EventPollVM | null;
  moments: Array<{
    id: string;
    title: string;
    kind: EventTimelineMomentKind;
    startsAt: string;
    endsAt: string | null;
    locationName?: string | null;
    locationAddress?: string | null;
    note?: string | null;
    position: number;
  }>;
  programmeLive?: ProgrammeLiveData;
};

export type TimelineMoment = TimelineModuleProps["moments"][number];

export type MomentSuggestion = {
  title: string;
  kind: EventTimelineMomentKind;
};

export type EditorState = {
  mode: "create" | "edit";
  momentId?: string;
  title: string;
  kind: EventTimelineMomentKind;
  startsAt: string;
  endsAt: string;
  locationName: string;
  locationAddress: string;
  note: string;
};

export type MomentExecutionState = "past" | "current" | "next" | "future";

export type LiveTimelineMoment = TimelineMoment & { state: MomentExecutionState };

export type TimelineDayGroup = {
  day: string;
  label: string;
  items: LiveTimelineMoment[];
  hasCurrent: boolean;
  hasNext: boolean;
};

export type TimelineSummary =
  | {
      mode: "current";
      primary: LiveTimelineMoment;
      secondary: LiveTimelineMoment | null;
    }
  | {
      mode: "next";
      primary: LiveTimelineMoment;
      secondary: null;
    }
  | {
      mode: "done";
    }
  | null;
