// lib/session.ts

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Récupère l'utilisateur courant avec son ID garanti
 * @returns { user, userId } ou null si non authentifié
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // Extraire ou récupérer l'ID
  const userId =
    session.user.id ??
    (
      await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
      })
    )?.id;

  if (!userId) {
    return null;
  }

  return {
    user: session.user,
    userId,
  };
}

/**
 * Récupère l'utilisateur courant ou throw une erreur
 * Utile pour les Server Actions où on veut une erreur claire
 */
export async function requireCurrentUser() {
  const result = await getCurrentUser();

  if (!result) {
    throw new Error("Non authentifié");
  }

  return result;
}

/**
 * Vérifie si l'utilisateur est membre d'un événement
 */
export async function isEventMember(eventId: string, userId: string) {
  const membership = await prisma.eventMember.findFirst({
    where: {
      eventId,
      userId,
    },
    select: { id: true },
  });

  return !!membership;
}

/**
 * Vérifie si l'utilisateur est owner d'un événement
 */
export async function isEventOwner(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      ownerId: userId,
    },
    select: { id: true },
  });

  return !!event;
}
