import {
  calculateCommittedAmount,
  calculatePaidAmount,
  compareMoney,
  subtractMoney,
  sumMoney,
} from "@/features/budget/lib/calculations";
import {
  serializeDateValue,
  serializeMoneyValue,
  serializeNullableMoneyValue,
} from "@/features/budget/lib/serializers";
import { BUDGET_DEFAULT_CURRENCY } from "@/features/budget/lib/constants";
import type { BudgetSummaryData, PaymentEntrySnapshot } from "@/features/budget/lib/types";
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

export async function getBudgetSummary(eventSlug: string): Promise<BudgetSummaryData> {
  const access = await requireBudgetAccess(eventSlug);

  const budget = await prisma.budget.findUnique({
    where: { id: access.budget.id },
    select: {
      id: true,
      eventId: true,
      totalBudget: true,
      lines: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          label: true,
          sourcingStatus: true,
          targetAmount: true,
          estimatedAmount: true,
          selectedQuote: {
            select: {
              vendor: { select: { name: true } },
              amount: true,
            },
          },
          quotes: {
            select: {
              status: true,
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

  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const lines = budget.lines.map((line) => {
    const payments = line.payments.map(serializePaymentEntry);
    const targetAmount = serializeMoneyValue(line.targetAmount);
    const estimatedAmount = serializeNullableMoneyValue(line.estimatedAmount);
    const committedAmount = calculateCommittedAmount({
      sourcingStatus: line.sourcingStatus,
      selectedQuoteAmount: serializeNullableMoneyValue(line.selectedQuote?.amount),
    });
    const paidAmount = calculatePaidAmount(payments);

    return {
      id: line.id,
      label: line.label,
      sourcingStatus: line.sourcingStatus,
      targetAmount,
      estimatedAmount,
      committedAmount,
      paidAmount,
      selectedVendorName: line.selectedQuote?.vendor.name ?? null,
      payments,
      quotesAwaitingResponse: line.quotes.filter((quote) => quote.status === "AWAITING_RESPONSE").length,
    };
  });

  const totals = {
    totalBudget: serializeMoneyValue(budget.totalBudget),
    estimated: sumMoney(lines.map((line) => line.estimatedAmount)),
    committed: sumMoney(lines.map((line) => line.committedAmount)),
    paid: sumMoney(lines.map((line) => line.paidAmount)),
  };

  const counts = {
    linesInSourcing: lines.filter((line) => line.sourcingStatus === "SOURCING").length,
    quotesAwaitingResponse: lines.reduce((total, line) => total + line.quotesAwaitingResponse, 0),
    overTargetLines: lines.filter(
      (line) => line.estimatedAmount && compareMoney(line.estimatedAmount, line.targetAmount) > 0,
    ).length,
    unpaidBookings: lines.filter(
      (line) =>
        line.sourcingStatus === "BOOKED" &&
        compareMoney(line.committedAmount, "0.00") > 0 &&
        compareMoney(line.paidAmount, line.committedAmount) < 0,
    ).length,
    paymentsDueThisWeek: lines
      .flatMap((line) => line.payments)
      .filter((payment) => {
        if (payment.paidAt) return false;
        const dueDate = new Date(payment.dueDate);
        return dueDate >= now && dueDate <= weekAhead;
      }).length,
  };

  const needsAttention = [
    ...lines
      .filter((line) => line.sourcingStatus === "SOURCING")
      .map((line) => ({
        id: `sourcing-${line.id}`,
        title: line.label,
        detail: "Encore en consultation, sans devis retenu.",
        href: `/event/${access.event.slug}/budget/quotes/${line.id}`,
      })),
    ...lines
      .filter((line) => line.estimatedAmount && compareMoney(line.estimatedAmount, line.targetAmount) > 0)
      .map((line) => ({
        id: `over-target-${line.id}`,
        title: line.label,
        detail: "L'estimation actuelle depasse le budget cible.",
        href: `/event/${access.event.slug}/budget/lines`,
      })),
    ...lines
      .filter(
        (line) =>
          line.sourcingStatus === "BOOKED" &&
          compareMoney(line.committedAmount, "0.00") > 0 &&
          compareMoney(line.paidAmount, line.committedAmount) < 0,
      )
      .map((line) => ({
        id: `unpaid-${line.id}`,
        title: line.label,
        detail: line.selectedVendorName
          ? `La reservation chez ${line.selectedVendorName} comporte encore un montant non regle.`
          : "Cette ligne reservee comporte encore un montant non regle.",
        href: `/event/${access.event.slug}/budget/lines`,
      })),
  ].slice(0, 6);

  const upcomingPayments = lines
    .flatMap((line) =>
      line.payments
        .filter((payment) => !payment.paidAt)
        .map((payment) => ({
          id: payment.id,
          lineId: line.id,
          lineLabel: line.label,
          paymentLabel: payment.label,
          dueDate: payment.dueDate,
          amount: payment.amount,
          vendorName: line.selectedVendorName,
        })),
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 5);

  return {
    event: access.event,
    hasDefinedTotal: Number(serializeMoneyValue(budget.totalBudget)) > 0,
    budget: {
      id: budget.id,
      eventId: budget.eventId,
      totalBudget: serializeMoneyValue(budget.totalBudget),
      currency: BUDGET_DEFAULT_CURRENCY,
    },
    totals: {
      ...totals,
      remaining: subtractMoney(totals.totalBudget, totals.committed),
    },
    counts,
    needsAttention,
    upcomingPayments,
  };
}
