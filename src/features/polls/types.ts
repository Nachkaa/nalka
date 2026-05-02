import type { EventPollStatus, EventPollType } from "@prisma/client";

export type EventPollVoterVM = {
  userId: string;
  name: string | null;
  email: string | null;
  isMe: boolean;
};

export type EventPollOptionVM = {
  id: string;
  label: string;
  count: number;
  checked: boolean;
  voters: EventPollVoterVM[];
};

export type EventPollVM = {
  id: string;
  type: EventPollType;
  status: EventPollStatus;
  isActive: boolean;
  options: EventPollOptionVM[];
};
