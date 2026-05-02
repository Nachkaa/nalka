import type { BringCategory, EventMemberRole } from "@prisma/client";

export type PotluckParticipant = {
  id: string;
  userId: string;
  user?: { name?: string | null; email?: string | null } | null;
};

export type PotluckItem = {
  id: string;
  label: string;
  note?: string | null;
  category: BringCategory;
  createdById?: string | null;
  bringers: PotluckParticipant[];
};

export type PotluckModuleProps = {
  eventId: string;
  slug: string;
  currentUserId: string;
  userRole: EventMemberRole;
  items: PotluckItem[];
  members: PotluckParticipant[];
};
