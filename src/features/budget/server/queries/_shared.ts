import { requireCurrentUser } from "@/lib/session";
import { requireEnabledModule } from "@/features/events/access";
import { prisma } from "@/lib/prisma";
import { EventModuleKey } from "@prisma/client";
import { notFound } from "next/navigation";

async function findBudgetAccess(eventSlug: string) {
  const { userId } = await requireCurrentUser();

  let access;
  try {
    access = await requireEnabledModule({
      slug: eventSlug,
      userId,
      key: EventModuleKey.EXPENSES,
      requireOrganizer: true,
    });
  } catch {
    return null;
  }

  const event = await prisma.event.findUnique({
    where: { id: access.event.id },
    select: {
      id: true,
      slug: true,
      title: true,
      budget: {
        select: {
          id: true,
          eventId: true,
          totalBudget: true,
          currency: true,
        },
      },
    },
  });

  if (!event || !event.budget) {
    return null;
  }

  return {
    userId,
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
    },
    budgetModuleEnabled: true,
    budget: event.budget,
  };
}

export async function requireBudgetAccess(eventSlug: string) {
  const access = await findBudgetAccess(eventSlug);

  if (!access) {
    notFound();
  }

  return access;
}

export async function requireWritableBudgetAccess(eventSlug: string) {
  const access = await findBudgetAccess(eventSlug);

  if (!access) {
    throw new Error("Vous n'avez pas l'autorisation de gerer ce budget.");
  }

  return access;
}
