import { EventMemberRole, EventModuleKey } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

type EventAccessLookup = {
  eventId?: string;
  slug?: string;
  userId?: string;
};

type EventAccessContext = {
  userId: string;
  event: {
    id: string;
    slug: string;
    ownerId: string;
    modules: Array<{
      id: string;
      key: EventModuleKey;
      enabled: boolean;
      position: number;
    }>;
  };
  membership: {
    role: EventMemberRole;
  };
};

function resolveEventWhere(input: EventAccessLookup) {
  if (input.eventId) {
    return { id: input.eventId };
  }

  if (input.slug) {
    return { slug: input.slug };
  }

  throw new Error("Event lookup requires an eventId or a slug.");
}

export function isOrganizerRole(role: EventMemberRole) {
  return role === EventMemberRole.ADMIN || role === EventMemberRole.OWNER;
}

export async function getEventAccessContext(input: EventAccessLookup): Promise<EventAccessContext | null> {
  const userId = input.userId ?? (await requireCurrentUser()).userId;

  const event = await prisma.event.findFirst({
    where: {
      ...resolveEventWhere(input),
      memberships: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          key: true,
          enabled: true,
          position: true,
        },
      },
      memberships: {
        where: { userId },
        select: {
          role: true,
        },
        take: 1,
      },
    },
  });

  const membership = event?.memberships[0];
  if (!event || !membership) {
    return null;
  }

  return {
    userId,
    event: {
      id: event.id,
      slug: event.slug,
      ownerId: event.ownerId,
      modules: event.modules,
    },
    membership,
  };
}

export async function requireEventMembership(input: EventAccessLookup) {
  const context = await getEventAccessContext(input);

  if (!context) {
    throw new Error("Forbidden");
  }

  return context;
}

export async function requireEventOrganizer(input: EventAccessLookup) {
  const context = await requireEventMembership(input);

  if (!isOrganizerRole(context.membership.role)) {
    throw new Error("Forbidden");
  }

  return context;
}

export async function requireEnabledModule(
  input: EventAccessLookup & {
    key: EventModuleKey;
    requireOrganizer?: boolean;
  },
) {
  const context = input.requireOrganizer
    ? await requireEventOrganizer(input)
    : await requireEventMembership(input);

  const eventModule = context.event.modules.find((module) => module.key === input.key);
  if (!eventModule || !eventModule.enabled) {
    throw new Error("Not found");
  }

  return {
    ...context,
    eventModule,
  };
}
