import { requireCurrentUser } from "@/lib/session";
import { requireEnabledModule } from "@/features/events/access";
import { BUDGET_DEFAULT_CURRENCY } from "@/features/budget/lib/constants";
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
      key: EventModuleKey.BUDGET,
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
        },
      },
    },
  });

  if (!event || !event.budget) {
    if (event && !event.budget) {
      console.error("[BUDGET_INTEGRITY]", {
        message: "Budget record missing for active BUDGET module",
        eventId: event.id,
        eventSlug,
      });
    }
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
    budget: {
      ...event.budget,
      currency: BUDGET_DEFAULT_CURRENCY,
    },
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
