// app/(app)/event/[slug]/actions/rsvp.ts

"use server";

import { auth } from "@/auth";
import { requireEventOrganizer } from "@/features/events/access";
import { getEventModulePosition } from "@/features/events/module-registry";
import { prisma } from "@/lib/prisma";
import { EventRsvpStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const rsvpSchema = z.object({
  eventId: z.string().min(1),
  status: z.nativeEnum(EventRsvpStatus),
});

export async function updateRsvp(input: { eventId: string; status: EventRsvpStatus }) {
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid RSVP payload" };

  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const userId =
    session.user.id ??
    (
      await prisma.user.findUnique({
        where: { email: session.user.email ?? "" },
        select: { id: true },
      })
    )?.id;

  if (!userId) return { ok: false, error: "Unauthorized" };

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId, eventId: parsed.data.eventId } },
    include: { event: { select: { slug: true } } },
  });

  if (!membership) return { ok: false, error: "Forbidden" };

  const updated = await prisma.eventMember.update({
    where: { userId_eventId: { userId, eventId: parsed.data.eventId } },
    data: {
      rsvpStatus: parsed.data.status,
      rsvpRespondedAt: new Date(),
    },
    select: { rsvpStatus: true, rsvpRespondedAt: true },
  });

  revalidatePath(`/event/${membership.event.slug}`);

  return {
    ok: true,
    status: updated.rsvpStatus,
    respondedAt: updated.rsvpRespondedAt?.toISOString() ?? null,
  };
}

export async function enableRsvpRequirement(params: { eventId: string; slug: string }) {
  try {
    await requireEventOrganizer({ eventId: params.eventId });
  } catch {
    return { ok: false, error: "Accès refusé" };
  }

  const overviewModule = await prisma.eventModule.upsert({
    where: { eventId_key: { eventId: params.eventId, key: "OVERVIEW" } },
    update: { enabled: true, position: getEventModulePosition("OVERVIEW") },
    create: {
      eventId: params.eventId,
      key: "OVERVIEW",
      enabled: true,
      position: getEventModulePosition("OVERVIEW"),
    },
  });

  await prisma.eventOverviewSettings.upsert({
    where: { eventModuleId: overviewModule.id },
    update: { rsvpRequired: true },
    create: { eventModuleId: overviewModule.id, rsvpRequired: true },
  });

  revalidatePath(`/event/${params.slug}`, "page");
  return { ok: true };
}
