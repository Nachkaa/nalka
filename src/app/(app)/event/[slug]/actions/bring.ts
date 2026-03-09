// app/(app)/event/[slug]/actions/bring.ts

"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { BringCategory } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// HELPERS DE PERMISSIONS
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie que l'utilisateur est membre de l'événement
 */
async function assertMemberAccess(eventId: string, userId: string) {
  const membership = await prisma.eventMember.findFirst({
    where: {
      eventId,
      userId,
    },
  });

  if (!membership) {
    throw new Error("Vous devez être membre de cet événement");
  }

  return membership;
}

/**
 * Vérifie que l'utilisateur participe à l'événement
 * Note: Actuellement EventMember n'a pas de champ isAttending
 * On vérifie juste qu'il est membre pour l'instant
 */
async function assertParticipantAccess(eventId: string, userId: string) {
  const membership = await assertMemberAccess(eventId, userId);

  // TODO: Ajouter isAttending au schéma EventMember si nécessaire
  // if (!membership.isAttending) {
  //   throw new Error("Vous devez participer à l'événement");
  // }

  return membership;
}

/**
 * Vérifie si l'utilisateur peut modifier/supprimer un item
 * - Admin/Owner : toujours
 * - Créateur : seulement si c'est son item
 */
async function canManageItem(itemId: string, userId: string): Promise<boolean> {
  const item = await prisma.eventBringItem.findUnique({
    where: { id: itemId },
  });

  if (!item) return false;

  const membership = await prisma.eventMember.findFirst({
    where: {
      eventId: item.eventId,
      userId,
    },
  });

  if (!membership) return false;

  // Admin/Owner peut toujours gérer
  if (membership.role === "ADMIN" || membership.role === "OWNER") return true;

  // Créateur peut gérer son propre item
  if (item.createdById === userId) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────
// CRÉER UN ITEM
// ─────────────────────────────────────────────────────────────

export async function createBringItem(params: {
  eventId: string;
  slug: string;
  label: string;
  category: BringCategory;
  note?: string;
  autoJoin?: boolean; // Par défaut true
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Non authentifié");

    // Vérifier que l'utilisateur est membre
    await assertMemberAccess(params.eventId, userId);

    const label = params.label.trim();
    if (!label) throw new Error("Le libellé est requis");

    // Créer l'item
    const item = await prisma.eventBringItem.create({
      data: {
        eventId: params.eventId,
        label,
        category: params.category,
        note: params.note?.trim() || null,
        createdById: userId,
      },
    });

    // Auto-inscription par défaut (sauf si explicitement désactivé)
    if (params.autoJoin !== false) {
      const membership = await prisma.eventMember.findFirst({
        where: {
          eventId: params.eventId,
          userId,
        },
      });

      // Créer la participation
      if (membership) {
        await prisma.eventBringParticipation.create({
          data: {
            userId,
            itemId: item.id,
          },
        });
      }
    }

    revalidatePath(`/event/${params.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("createBringItem error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// METTRE À JOUR UN ITEM
// ─────────────────────────────────────────────────────────────

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
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Non authentifié");

    // Vérifier les permissions (admin ou créateur)
    const canManage = await canManageItem(params.itemId, userId);
    if (!canManage) {
      throw new Error("Vous ne pouvez pas modifier cet élément");
    }

    // Vérifier que l'item appartient bien à cet event
    const item = await prisma.eventBringItem.findUnique({
      where: { id: params.itemId },
    });

    if (!item || item.eventId !== params.eventId) {
      throw new Error("Élément introuvable");
    }

    await prisma.$transaction(async (tx) => {
      // Mise à jour des champs de base
      await tx.eventBringItem.update({
        where: { id: params.itemId },
        data: {
          ...(params.label && { label: params.label.trim() }),
          ...(params.category && { category: params.category }),
          ...(params.note !== undefined && {
            note: params.note.trim() || null,
          }),
        },
      });

      if (params.bringerIds !== undefined) {
        // Supprimer toutes les participations existantes
        await tx.eventBringParticipation.deleteMany({
          where: { itemId: params.itemId },
        });

        // Créer les nouvelles participations
        if (params.bringerIds.length > 0) {
          await tx.eventBringParticipation.createMany({
            data: params.bringerIds.map((userId) => ({
              userId,
              itemId: params.itemId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    revalidatePath(`/event/${params.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("updateBringItem error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// SUPPRIMER UN ITEM
// ─────────────────────────────────────────────────────────────

export async function deleteBringItem(params: {
  itemId: string;
  eventId: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Non authentifié");

    // Récupérer l'item avec ses participations
    const item = await prisma.eventBringItem.findUnique({
      where: { id: params.itemId },
      include: {
        bringers: true, // ✅ Correction: "participations" → "bringers"
      },
    });

    if (!item || item.eventId !== params.eventId) {
      throw new Error("Élément introuvable");
    }

    // Vérifier les permissions
    const membership = await prisma.eventMember.findFirst({
      where: {
        eventId: params.eventId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous devez être membre de l'événement");
    }

    const isAdmin = membership.role === "ADMIN" || membership.role === "OWNER";
    const isCreator = item.createdById === userId;
    const hasOtherParticipants =
      item.bringers.length > 1 ||
      (item.bringers.length === 1 && item.bringers[0].userId !== userId);

    // Admin peut toujours supprimer
    if (isAdmin) {
      await prisma.eventBringItem.delete({
        where: { id: params.itemId },
      });
      revalidatePath(`/event/${params.slug}`, "page");
      return { ok: true };
    }

    // Créateur peut supprimer seulement si :
    // - Aucun participant
    // - Ou lui seul est participant
    if (isCreator && !hasOtherParticipants) {
      await prisma.eventBringItem.delete({
        where: { id: params.itemId },
      });
      revalidatePath(`/event/${params.slug}`, "page");
      return { ok: true };
    }

    // Sinon refusé
    throw new Error(
      "Vous ne pouvez pas supprimer cet élément car d'autres personnes se sont inscrites. Retirez d'abord votre participation.",
    );
  } catch (error) {
    console.error("deleteBringItem error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// TOGGLE PARTICIPATION (Je ramène / Je ne ramène plus)
// ─────────────────────────────────────────────────────────────

export async function toggleBringParticipation(params: {
  itemId: string;
  eventId: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Non authentifié");

    // Vérifier que l'item appartient bien à cet event
    const item = await prisma.eventBringItem.findUnique({
      where: { id: params.itemId },
    });

    if (!item || item.eventId !== params.eventId) {
      throw new Error("Élément introuvable");
    }

    // Vérifier que l'utilisateur participe à l'événement
    await assertParticipantAccess(params.eventId, userId);

    // Toggle
    const existing = await prisma.eventBringParticipation.findFirst({
      where: {
        userId,
        itemId: params.itemId,
      },
    });

    if (existing) {
      // Retirer la participation
      await prisma.eventBringParticipation.delete({
        where: {
          id: existing.id,
        },
      });
    } else {
      // Ajouter la participation
      await prisma.eventBringParticipation.create({
        data: {
          userId,
          itemId: params.itemId,
        },
      });
    }

    revalidatePath(`/event/${params.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("toggleBringParticipation error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
