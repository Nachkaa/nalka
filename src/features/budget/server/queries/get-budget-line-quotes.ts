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
import { BUDGET_DEFAULT_CURRENCY } from "@/features/budget/lib/constants";
import type {
  BudgetLineQuotesData,
  PaymentEntrySnapshot,
  QuoteAttachmentSnapshot,
  QuoteSnapshot,
} from "@/features/budget/lib/types";
import { requireBudgetAccess } from "@/features/budget/server/queries/_shared";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function serializeAttachment(attachment: {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: Date;
}): QuoteAttachmentSnapshot {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    mimeType: attachment.mimeType,
    fileSizeBytes: attachment.fileSizeBytes,
    createdAt: serializeDateValue(attachment.createdAt)!,
  };
}

function serializeQuote(quote: {
  id: string;
  budgetLineId: string;
  vendorId: string;
  status: "AWAITING_RESPONSE" | "RECEIVED" | "SELECTED" | "REJECTED";
  amount: { toString(): string } | null;
  scope: string | null;
  requestedAt: Date | null;
  receivedAt: Date | null;
  validUntil: Date | null;
  internalNote: string | null;
  decisionNote: string | null;
  vendor: { name: string };
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    createdAt: Date;
  }>;
}): QuoteSnapshot {
  return {
    id: quote.id,
    budgetLineId: quote.budgetLineId,
    vendorId: quote.vendorId,
    vendorName: quote.vendor.name,
    status: quote.status,
    amount: serializeNullableMoneyValue(quote.amount),
    scope: quote.scope,
    requestedAt: serializeDateValue(quote.requestedAt),
    receivedAt: serializeDateValue(quote.receivedAt),
    validUntil: serializeDateValue(quote.validUntil),
    internalNote: quote.internalNote,
    decisionNote: quote.decisionNote,
    attachments: quote.attachments.map(serializeAttachment),
  };
}

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

export async function getBudgetLineQuotes(eventSlug: string, lineId: string): Promise<BudgetLineQuotesData> {
  const access = await requireBudgetAccess(eventSlug);

  const line = await prisma.budgetLine.findFirst({
    where: {
      id: lineId,
      budget: {
        id: access.budget.id,
      },
    },
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
          id: true,
          budgetLineId: true,
          vendorId: true,
          status: true,
          amount: true,
          scope: true,
          requestedAt: true,
          receivedAt: true,
          validUntil: true,
          internalNote: true,
          decisionNote: true,
          vendor: { select: { name: true } },
          attachments: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              mimeType: true,
              fileSizeBytes: true,
              createdAt: true,
            },
          },
        },
      },
      quotes: {
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          budgetLineId: true,
          vendorId: true,
          status: true,
          amount: true,
          scope: true,
          requestedAt: true,
          receivedAt: true,
          validUntil: true,
          internalNote: true,
          decisionNote: true,
          vendor: { select: { name: true } },
          attachments: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              mimeType: true,
              fileSizeBytes: true,
              createdAt: true,
            },
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
      budget: {
        select: {
          id: true,
          eventId: true,
          totalBudget: true,
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
        },
      },
    },
  });

  if (!line) {
    notFound();
  }

  const payments = line.payments.map(serializePaymentEntry);
  const quotes = line.quotes.map(serializeQuote);
  const committedAmount = calculateCommittedAmount({
    sourcingStatus: line.sourcingStatus,
    selectedQuoteAmount: serializeNullableMoneyValue(line.selectedQuote?.amount),
  });
  const paidAmount = calculatePaidAmount(payments);

  return {
    event: access.event,
    budget: {
      id: line.budget.id,
      eventId: line.budget.eventId,
      totalBudget: serializeMoneyValue(line.budget.totalBudget),
      currency: BUDGET_DEFAULT_CURRENCY,
    },
    vendors: line.budget.event.vendors,
    line: {
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
      quotesReceivedCount: quotes.filter((quote) => quote.status !== "AWAITING_RESPONSE").length,
      attachmentsCount: quotes.reduce((total, quote) => total + quote.attachments.length, 0),
      nextPaymentDue: payments.find((payment) => !payment.paidAt)?.dueDate ?? null,
      paymentEntries: payments,
      internalNote: line.internalNote,
      selectedQuote: line.selectedQuote ? serializeQuote(line.selectedQuote) : null,
      receivedQuotes: quotes.filter((quote) => quote.status === "RECEIVED"),
      awaitingResponseQuotes: quotes.filter((quote) => quote.status === "AWAITING_RESPONSE"),
      rejectedQuotes: quotes.filter((quote) => quote.status === "REJECTED"),
      allAttachments: quotes.flatMap((quote) => quote.attachments),
    },
  };
}
