"use client";

import type { BringCategory, EventMemberRole } from "@prisma/client";
import { BringClient } from "../../../bring/_components/bring-client";

export type PotluckModuleProps = {
  eventId: string;
  slug: string;
  currentUserId: string;
  userRole: EventMemberRole;
  items: Array<{
    id: string;
    label: string;
    note?: string | null;
    category: BringCategory;
    createdById?: string | null;
    bringers: {
      id: string;
      userId: string;
      user?: { name?: string | null; email?: string | null } | null;
    }[];
  }>;
  members: Array<{
    id: string;
    userId: string;
    user: { name?: string | null; email?: string | null } | null;
  }>;
};

export function PotluckModule({
  eventId,
  slug,
  currentUserId,
  userRole,
  items,
  members,
}: PotluckModuleProps) {
  return (
    <BringClient
      eventId={eventId}
      slug={slug}
      items={items}
      members={members}
      currentUserId={currentUserId}
      userRole={userRole}
    />
  );
}
