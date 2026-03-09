import { EventMemberRole, EventRsvpStatus } from "@prisma/client";

export type ParticipantRow = {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  rsvpStatus: EventRsvpStatus;
  role?: EventMemberRole | null;
};

export type ParticipantsCounts = {
  total: number;
  going: number;
  maybe: number;
  notGoing: number;
  pending: number;
};

export type ParticipantsFilter = "ALL" | EventRsvpStatus;
