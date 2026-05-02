import {
  serializeMoneyValue,
  serializeNullableMoneyValue,
} from "@/features/budget/lib/serializers";
import type { BudgetQuotesOverviewData, QuoteStatus } from "@/features/budget/lib/types";
import { requireBudgetAccess } from "@/features/budget/server/queries/_shared";
import { prisma } from "@/lib/prisma";

const QUOTE_STATUSES: QuoteStatus[] = ["AWAITING_RESPONSE", "RECEIVED", "SELECTED", "REJECTED"];

export async function getBudgetQuotesOverview(eventSlug: string): Promise<BudgetQuotesOverviewData> {
  const access = await requireBudgetAccess(eventSlug);

  const budget = await prisma.budget.findUnique({
    where: { id: access.budget.id },
    select: {
      id: true,
      eventId: true,
      totalBudget: true,
      currency: true,
      event: {
        select: {
          vendors: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              vendorType: true,
              contactName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      lines: {
        orderBy: [{ sourcingStatus: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          label: true,
          category: true,
          targetAmount: true,
          estimatedAmount: true,
          sourcingStatus: true,
          selectedQuote: {
            select: {
              vendor: { select: { name: true } },
            },
          },
          quotes: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!budget) {
    throw new Error("Budget introuvable");
  }

  return {
    event: access.event,
    budget: {
      id: budget.id,
      eventId: budget.eventId,
      totalBudget: serializeMoneyValue(budget.totalBudget),
      currency: budget.currency,
    },
    vendors: budget.event.vendors,
    totalQuotesCount: budget.lines.reduce((total, line) => total + line.quotes.length, 0),
    lines: budget.lines.map((line) => ({
      id: line.id,
      label: line.label,
      category: line.category,
      targetAmount: serializeMoneyValue(line.targetAmount),
      estimatedAmount: serializeNullableMoneyValue(line.estimatedAmount),
      sourcingStatus: line.sourcingStatus,
      selectedVendorName: line.selectedQuote?.vendor.name ?? null,
      quoteCounts: QUOTE_STATUSES.reduce(
        (counts, status) => ({
          ...counts,
          [status]: line.quotes.filter((quote) => quote.status === status).length,
        }),
        {
          AWAITING_RESPONSE: 0,
          RECEIVED: 0,
          SELECTED: 0,
          REJECTED: 0,
        } satisfies Record<QuoteStatus, number>,
      ),
    })),
  };
}
