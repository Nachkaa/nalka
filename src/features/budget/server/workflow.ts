import { fromCents, toCents } from "@/features/budget/lib/calculations";
import type {
  BudgetLineSourcingStatus,
  BudgetMoneyValue,
  PaymentEntrySnapshot,
} from "@/features/budget/lib/types";

export type PaymentAmountCheckResult =
  | { ok: true }
  | { ok: false; reason: "OVER_PAYMENT"; committed: string; projected: string };

export function checkPaymentAmountVsCommitted(args: {
  committedDecimal: string;
  existingDecimal: string;
  newDecimal: string;
}): PaymentAmountCheckResult {
  const committedCents = toCents(args.committedDecimal);
  const existingCents = toCents(args.existingDecimal);
  const newCents = toCents(args.newDecimal);
  if (existingCents + newCents > committedCents) {
    return {
      ok: false,
      reason: "OVER_PAYMENT",
      committed: fromCents(committedCents),
      projected: fromCents(existingCents + newCents),
    };
  }
  return { ok: true };
}

type QuoteForSelectionRule = {
  status: string;
  amount: { toString(): string } | null;
};

type QuoteForRejectionRule = {
  id: string;
  budgetLine: { selectedQuoteId: string | null };
};

type BudgetLineForBookingRule = {
  sourcingStatus: BudgetLineSourcingStatus;
  selectedQuoteId: string | null;
  selectedQuote: {
    id: string;
    amount: { toString(): string } | null;
  } | null;
};

type BudgetLineForPaymentRule = {
  sourcingStatus: BudgetLineSourcingStatus;
  selectedQuoteId: string | null;
};

type BudgetLineForReopenRule = {
  sourcingStatus: BudgetLineSourcingStatus;
  selectedQuoteId: string | null;
};

type SelectQuoteTransitionArgs = {
  budgetLineId: string;
  quoteId: string;
  decisionNote: string;
};

type ReopenSelectedLineTransitionArgs = {
  budgetLineId: string;
  selectedQuoteId: string;
  decisionNote: string;
  receivedQuotesCount: number;
  awaitingResponseQuotesCount: number;
};

export function ensureQuoteCanBeSelected(quote: QuoteForSelectionRule) {
  if (quote.status !== "RECEIVED") {
    throw new Error("Seuls les devis recus peuvent etre retenus");
  }

  if (!quote.amount) {
    throw new Error("Un montant de devis est requis avant la selection");
  }
}

export function ensureQuoteCanBeRejected(quote: QuoteForRejectionRule) {
  if (quote.budgetLine.selectedQuoteId === quote.id) {
    throw new Error("Changez le devis retenu avant de le refuser");
  }
}

export function ensureBudgetLineCanBeBooked(line: BudgetLineForBookingRule) {
  if (line.sourcingStatus !== "SELECTED") {
    throw new Error("Seules les lignes retenues peuvent etre marquees comme reservees");
  }

  if (!line.selectedQuoteId || !line.selectedQuote) {
    throw new Error("Un devis retenu est requis avant la reservation");
  }

  if (!line.selectedQuote.amount) {
    throw new Error("Le devis retenu doit avoir un montant avant la reservation");
  }
}

export function ensureBudgetLineAllowsPayments(line: BudgetLineForPaymentRule) {
  if (line.sourcingStatus !== "BOOKED") {
    throw new Error("Les echeances de paiement ne peuvent etre ajoutees qu'aux lignes reservees");
  }

  if (!line.selectedQuoteId) {
    throw new Error("Un devis retenu est requis avant d'ajouter un paiement");
  }
}

export function ensureBudgetLineCanBeReopened(line: BudgetLineForReopenRule) {
  if (line.sourcingStatus === "BOOKED") {
    throw new Error("Les lignes reservees ne peuvent pas etre rouvertes pour le moment");
  }

  if (line.sourcingStatus !== "SELECTED") {
    throw new Error("Seules les lignes retenues peuvent etre rouvertes");
  }

  if (!line.selectedQuoteId) {
    throw new Error("Un devis retenu est requis avant la reouverture");
  }
}

export function getReopenedLineFallbackStatus(args: {
  receivedQuotesCount: number;
  awaitingResponseQuotesCount: number;
}): BudgetLineSourcingStatus {
  if (args.receivedQuotesCount > 0) {
    return "QUOTES_RECEIVED";
  }

  if (args.awaitingResponseQuotesCount > 0) {
    return "SOURCING";
  }

  return "DRAFT";
}

export function buildSelectQuoteTransaction(args: SelectQuoteTransitionArgs) {
  return {
    demoteSelectedWhere: {
      budgetLineId: args.budgetLineId,
      status: "SELECTED" as const,
      NOT: { id: args.quoteId },
    },
    demoteSelectedData: {
      status: "RECEIVED" as const,
    },
    selectQuoteWhere: { id: args.quoteId },
    selectQuoteData: {
      status: "SELECTED" as const,
      decisionNote: args.decisionNote || null,
    },
    updateLineWhere: { id: args.budgetLineId },
    updateLineData: {
      selectedQuoteId: args.quoteId,
      sourcingStatus: "SELECTED" as const,
    },
  };
}

export function buildRejectQuoteUpdate(decisionNote: string) {
  return {
    status: "REJECTED" as const,
    decisionNote: decisionNote || null,
  };
}

export function buildMarkBookedUpdate() {
  return {
    sourcingStatus: "BOOKED" as const,
  };
}

export function buildReopenSelectedLineTransaction(args: ReopenSelectedLineTransitionArgs) {
  const fallbackStatus = getReopenedLineFallbackStatus({
    receivedQuotesCount: args.receivedQuotesCount,
    awaitingResponseQuotesCount: args.awaitingResponseQuotesCount,
  });

  return {
    reopenQuoteWhere: { id: args.selectedQuoteId },
    reopenQuoteData: {
      status: "RECEIVED" as const,
      decisionNote: args.decisionNote || null,
    },
    updateLineWhere: { id: args.budgetLineId },
    updateLineData: {
      selectedQuoteId: null,
      sourcingStatus: fallbackStatus,
    },
  };
}

export function buildPaymentEntryCreateData(args: {
  budgetLineId: string;
  quoteId: string | null;
  label: string;
  entryType: PaymentEntrySnapshot["entryType"];
  amount: BudgetMoneyValue;
  dueDate: Date;
  note: string | null;
}) {
  return {
    budgetLineId: args.budgetLineId,
    quoteId: args.quoteId,
    label: args.label,
    entryType: args.entryType,
    amount: args.amount,
    dueDate: args.dueDate,
    note: args.note,
  };
}

export function resolvePaidAtOverride(paidAt: string | null | undefined, now: Date) {
  return paidAt ? new Date(paidAt) : now;
}
