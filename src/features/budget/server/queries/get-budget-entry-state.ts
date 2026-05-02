import {
  serializeMoneyValue,
  serializeNullableMoneyValue,
} from "@/features/budget/lib/serializers";
import type { BudgetEntryStateData } from "@/features/budget/lib/types";
import { requireBudgetAccess } from "@/features/budget/server/queries/_shared";
import { prisma } from "@/lib/prisma";

export async function getBudgetEntryState(eventSlug: string): Promise<BudgetEntryStateData> {
  const access = await requireBudgetAccess(eventSlug);

  const budget = await prisma.budget.findUnique({
    where: { id: access.budget.id },
    select: {
      id: true,
      eventId: true,
      totalBudget: true,
      currency: true,
      setupStatus: true,
      lines: {
        orderBy: [{ category: "asc" }, { createdAt: "asc" }],
        take: 5,
        select: {
          id: true,
          category: true,
          label: true,
          targetAmount: true,
          estimatedAmount: true,
        },
      },
      _count: {
        select: {
          lines: true,
        },
      },
    },
  });

  if (!budget) {
    throw new Error("Budget introuvable");
  }

  const totalBudget = serializeMoneyValue(budget.totalBudget);
  const hasDefinedTotal = Number(totalBudget) > 0;
  const [estimatedLinesCount, quotesCount, paymentsCount] = await Promise.all([
    prisma.budgetLine.count({
      where: {
        budgetId: budget.id,
        estimatedAmount: {
          not: null,
        },
      },
    }),
    prisma.quote.count({
      where: {
        budgetLine: {
          budgetId: budget.id,
        },
      },
    }),
    prisma.paymentEntry.count({
      where: {
        budgetLine: {
          budgetId: budget.id,
        },
      },
    }),
  ]);

  return {
    event: access.event,
    budget: {
      id: budget.id,
      eventId: budget.eventId,
      totalBudget,
      currency: budget.currency,
      setupStatus: budget.setupStatus,
    },
    linesCount: budget._count.lines,
    estimatedLinesCount,
    quotesCount,
    paymentsCount,
    hasDefinedTotal,
    previewLines: budget.lines.map((line) => ({
      id: line.id,
      category: line.category,
      label: line.label,
      targetAmount: serializeMoneyValue(line.targetAmount),
      estimatedAmount: serializeNullableMoneyValue(line.estimatedAmount),
    })),
  };
}
