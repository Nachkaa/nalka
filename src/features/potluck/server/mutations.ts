"use server";

import type { BringCategory } from "@prisma/client";
import { EventMemberRole, EventModuleKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireEnabledModule } from "@/features/events/access";
import { prisma } from "@/lib/prisma";

function revalidatePotluckPath(slug: string) {
  revalidatePath(`/event/${slug}`, "page");
}

async function requirePotluckMember(eventId: string, slug: string) {
  return requireEnabledModule({
    eventId,
    slug,
    key: EventModuleKey.POTLUCK,
  });
}

async function getManageItemContext(itemId: string, eventId: string, slug: string) {
  const access = await requirePotluckMember(eventId, slug);

  const item = await prisma.eventBringItem.findUnique({
    where: { id: itemId },
    include: {
      bringers: true,
    },
  });

  if (!item || item.eventId !== access.event.id) {
    throw new Error("Élément introuvable");
  }

  const isOrganizer =
    access.membership.role === EventMemberRole.ADMIN ||
    access.membership.role === EventMemberRole.OWNER;
  const isCreator = item.createdById === access.userId;

  return {
    access,
    item,
    isOrganizer,
    isCreator,
  };
}

export async function createBringItem(params: {
  eventId: string;
  slug: string;
  label: string;
  category: BringCategory;
  note?: string;
  autoJoin?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const access = await requirePotluckMember(params.eventId, params.slug);
    const label = params.label.trim();
    if (!label) throw new Error("Le libellé est requis");

    const item = await prisma.eventBringItem.create({
      data: {
        eventId: access.event.id,
        label,
        category: params.category,
        note: params.note?.trim() || null,
        createdById: access.userId,
      },
    });

    if (params.autoJoin !== false) {
      await prisma.eventBringParticipation.create({
        data: {
          userId: access.userId,
          itemId: item.id,
        },
      });
    }

    revalidatePotluckPath(access.event.slug);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function updateBringItem(params: {
  itemId: string;
  eventId: string;
  slug: string;
  label?: string;
  category?: BringCategory;
  note?: string;
  bringerIds?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { access, item, isOrganizer, isCreator } = await getManageItemContext(
      params.itemId,
      params.eventId,
      params.slug,
    );

    if (!isOrganizer && !isCreator) {
      throw new Error("Vous ne pouvez pas modifier cet élément");
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventBringItem.update({
        where: { id: item.id },
        data: {
          ...(params.label !== undefined && { label: params.label.trim() }),
          ...(params.category && { category: params.category }),
          ...(params.note !== undefined && {
            note: params.note.trim() || null,
          }),
        },
      });

      if (params.bringerIds !== undefined) {
        await tx.eventBringParticipation.deleteMany({
          where: { itemId: item.id },
        });

        if (params.bringerIds.length > 0) {
          await tx.eventBringParticipation.createMany({
            data: params.bringerIds.map((userId) => ({
              userId,
              itemId: item.id,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    revalidatePotluckPath(access.event.slug);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function deleteBringItem(params: {
  itemId: string;
  eventId: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { access, item, isOrganizer, isCreator } = await getManageItemContext(
      params.itemId,
      params.eventId,
      params.slug,
    );

    const hasOtherParticipants =
      item.bringers.length > 1 ||
      (item.bringers.length === 1 && item.bringers[0]?.userId !== access.userId);

    if (!isOrganizer && (!isCreator || hasOtherParticipants)) {
      throw new Error(
        "Vous ne pouvez pas supprimer cet élément car d'autres personnes se sont inscrites. Retirez d'abord votre participation.",
      );
    }

    await prisma.eventBringItem.delete({
      where: { id: item.id },
    });

    revalidatePotluckPath(access.event.slug);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function toggleBringParticipation(params: {
  itemId: string;
  eventId: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const access = await requirePotluckMember(params.eventId, params.slug);

    const item = await prisma.eventBringItem.findUnique({
      where: { id: params.itemId },
      select: { id: true, eventId: true },
    });

    if (!item || item.eventId !== access.event.id) {
      throw new Error("Élément introuvable");
    }

    const existing = await prisma.eventBringParticipation.findFirst({
      where: {
        userId: access.userId,
        itemId: item.id,
      },
    });

    if (existing) {
      await prisma.eventBringParticipation.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.eventBringParticipation.create({
        data: {
          userId: access.userId,
          itemId: item.id,
        },
      });
    }

    revalidatePotluckPath(access.event.slug);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
