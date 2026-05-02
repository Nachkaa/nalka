import { getEventShellFrame } from "@/features/events/get-event-shell-context";
import { requireBudgetAccess } from "@/features/budget/server/queries/_shared";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function getBudgetRouteContext(eventSlug: string) {
  const budgetAccess = await requireBudgetAccess(eventSlug);
  const linesCount = await prisma.budgetLine.count({
    where: { budgetId: budgetAccess.budget.id },
  });
  const frame = await getEventShellFrame({
    slug: eventSlug,
    userId: budgetAccess.userId,
  });
  if (frame.unauthorized) {
    notFound();
  }

  return {
    meId: frame.meId,
    slug: eventSlug,
    isAdmin: true,
    eventId: frame.eventId,
    giftMode: frame.giftMode,
    modules: frame.modules,
    navigation: frame.navigation,
    participants: frame.participants,
    rsvpSummary: frame.rsvpSummary,
    budget: budgetAccess.budget,
    hasLines: linesCount > 0,
    headerEvent: frame.headerEvent,
  };
}
