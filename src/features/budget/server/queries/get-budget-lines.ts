import {
  calculateCommittedAmount,
  calculatePaidAmount,
  calculateVariance,
  derivePaymentStatus,
} from "@/features/budget/lib/calculations";
import {
  serializeDateValue,
  serializeMoneyValue,
  serializeNullableMoneyValue,
} from "@/features/budget/lib/serializers";
import type { BudgetLinesData, PaymentEntrySnapshot } from "@/features/budget/lib/types";
import { requireBudgetAccess } from "@/features/budget/server/queries/_shared";
import { prisma } from "@/lib/prisma";

function serializePaymentEntry(payment: {
  id: string;
  budgetLineId: string;
  quoteId: string | null;
  label: string;
  entryType: "DEPOSIT" | "BALANCE" | "OTHER";
  amount: { toString(): string };
  dueDate: Date;
  paidAt: Date | null;
  note: string | null;
}): PaymentEntrySnapshot {
  return {
    id: payment.id,
    budgetLineId: payment.budgetLineId,
    quoteId: payment.quoteId,
    label: payment.label,
    entryType: payment.entryType,
    amount: serializeMoneyValue(payment.amount),
    dueDate: serializeDateValue(payment.dueDate)!,
    paidAt: serializeDateValue(payment.paidAt),
    note: payment.note,
  };
}

export async function getBudgetLines(eventSlug: string): Promise<BudgetLinesData> {
  const access = await requireBudgetAccess(eventSlug);

  const budget = await prisma.budget.findUnique({
    where: { id: access.budget.id },
    select: {
      id: true,
      eventId: true,
      totalBudget: true,
      currency: true,
      lines: {
        orderBy: [{ category: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          budgetId: true,
          category: true,
          label: true,
          targetAmount: true,
          estimatedAmount: true,
          sourcingStatus: true,
          internalNote: true,
          selectedQuoteId: true,
          selectedQuote: {
            select: {
              amount: true,
              vendor: { select: { name: true } },
            },
          },
          quotes: {
            select: {
              status: true,
              attachments: {
                select: { id: true },
              },
            },
          },
          payments: {
            orderBy: { dueDate: "asc" },
            select: {
              id: true,
              budgetLineId: true,
              quoteId: true,
              label: true,
              entryType: true,
              amount: true,
              dueDate: true,
              paidAt: true,
              note: true,
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
    lines: budget.lines.map((line) => {
      const payments = line.payments.map(serializePaymentEntry);
      const committedAmount = calculateCommittedAmount({
        sourcingStatus: line.sourcingStatus,
        selectedQuoteAmount: serializeNullableMoneyValue(line.selectedQuote?.amount),
      });
      const paidAmount = calculatePaidAmount(payments);

      return {
        id: line.id,
        budgetId: line.budgetId,
        label: line.label,
        category: line.category,
        targetAmount: serializeMoneyValue(line.targetAmount),
        estimatedAmount: serializeNullableMoneyValue(line.estimatedAmount),
        varianceAmount: calculateVariance(
          serializeNullableMoneyValue(line.estimatedAmount),
          serializeMoneyValue(line.targetAmount),
        ),
        committedAmount,
        paidAmount,
        sourcingStatus: line.sourcingStatus,
        paymentStatus: derivePaymentStatus({
          committedAmount,
          paidAmount,
          paymentEntries: payments,
        }),
        selectedVendorName: line.selectedQuote?.vendor.name ?? null,
        selectedQuoteId: line.selectedQuoteId,
        quotesReceivedCount: line.quotes.filter((quote) => quote.status !== "AWAITING_RESPONSE").length,
        attachmentsCount: line.quotes.reduce((total, quote) => total + quote.attachments.length, 0),
        nextPaymentDue: payments.find((payment) => !payment.paidAt)?.dueDate ?? null,
        paymentEntries: payments,
        internalNote: line.internalNote,
      };
    }),
  };
}
