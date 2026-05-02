import { prisma } from "@/lib/prisma";
import {
  ensureBudgetLineAllowsPayments,
  ensureBudgetLineCanBeBooked,
  ensureBudgetLineCanBeReopened,
  ensureQuoteCanBeRejected,
  ensureQuoteCanBeSelected,
} from "@/features/budget/server/workflow";

export async function assertBudgetLineWritableInEvent(args: {
  budgetLineId: string;
  eventId: string;
}) {
  const budgetLine = await prisma.budgetLine.findFirst({
    where: {
      id: args.budgetLineId,
      budget: {
        eventId: args.eventId,
      },
    },
    select: {
      id: true,
      budgetId: true,
      sourcingStatus: true,
    },
  });

  if (!budgetLine) {
    throw new Error("Ligne budgetaire introuvable");
  }

  return budgetLine;
}

export async function assertQuoteSelectableForBudgetLine(args: {
  budgetLineId: string;
  quoteId: string;
  eventId: string;
}) {
  const quote = await prisma.quote.findUnique({
    where: { id: args.quoteId },
    select: {
      id: true,
      budgetLineId: true,
      budgetLine: {
        select: {
          budget: {
            select: {
              eventId: true,
            },
          },
        },
      },
    },
  });

  if (!quote) {
    throw new Error("Devis introuvable");
  }

  if (quote.budgetLineId !== args.budgetLineId) {
    throw new Error("Le devis retenu doit appartenir a la meme ligne budgetaire");
  }

  if (quote.budgetLine.budget.eventId !== args.eventId) {
    throw new Error("Le devis retenu doit appartenir au meme evenement");
  }

  return quote;
}

export async function assertQuoteInEventChain(args: {
  quoteId: string;
  budgetLineId: string;
  eventId: string;
}) {
  const quote = await prisma.quote.findUnique({
    where: { id: args.quoteId },
    select: {
      id: true,
      status: true,
      amount: true,
      budgetLineId: true,
      decisionNote: true,
      budgetLine: {
        select: {
          id: true,
          selectedQuoteId: true,
          budget: {
            select: {
              eventId: true,
            },
          },
        },
      },
    },
  });

  if (!quote) {
    throw new Error("Devis introuvable");
  }

  if (quote.budgetLineId !== args.budgetLineId) {
    throw new Error("Le devis doit appartenir a la meme ligne budgetaire");
  }

  if (quote.budgetLine.budget.eventId !== args.eventId) {
    throw new Error("Le devis doit appartenir au meme evenement");
  }

  return quote;
}

export function assertQuoteCanBeSelected(quote: {
  status: string;
  amount: { toString(): string } | null;
}) {
  ensureQuoteCanBeSelected(quote);
}

export function assertQuoteCanBeRejected(quote: {
  id: string;
  budgetLine: { selectedQuoteId: string | null };
}) {
  ensureQuoteCanBeRejected(quote);
}

export async function assertBudgetLineBookableInEvent(args: {
  budgetLineId: string;
  eventId: string;
}) {
  const budgetLine = await prisma.budgetLine.findFirst({
    where: {
      id: args.budgetLineId,
      budget: {
        eventId: args.eventId,
      },
    },
    select: {
      id: true,
      sourcingStatus: true,
      selectedQuoteId: true,
      selectedQuote: {
        select: {
          id: true,
          amount: true,
        },
      },
    },
  });

  if (!budgetLine) {
    throw new Error("Ligne budgetaire introuvable");
  }

  ensureBudgetLineCanBeBooked(budgetLine);

  return budgetLine;
}

export async function assertPaymentEntryInEventChain(args: {
  paymentEntryId: string;
  budgetLineId: string;
  eventId: string;
}) {
  const paymentEntry = await prisma.paymentEntry.findUnique({
    where: { id: args.paymentEntryId },
    select: {
      id: true,
      paidAt: true,
      budgetLineId: true,
      budgetLine: {
        select: {
          budget: {
            select: {
              eventId: true,
            },
          },
        },
      },
    },
  });

  if (!paymentEntry) {
    throw new Error("Echeance de paiement introuvable");
  }

  if (paymentEntry.budgetLineId !== args.budgetLineId) {
    throw new Error("L'echeance de paiement doit appartenir a la meme ligne budgetaire");
  }

  if (paymentEntry.budgetLine.budget.eventId !== args.eventId) {
    throw new Error("L'echeance de paiement doit appartenir au meme evenement");
  }

  return paymentEntry;
}

export async function assertBudgetLineAllowsPayments(args: {
  budgetLineId: string;
  eventId: string;
}) {
  const budgetLine = await prisma.budgetLine.findFirst({
    where: {
      id: args.budgetLineId,
      budget: {
        eventId: args.eventId,
      },
    },
    select: {
      id: true,
      sourcingStatus: true,
      selectedQuoteId: true,
    },
  });

  if (!budgetLine) {
    throw new Error("Ligne budgetaire introuvable");
  }

  ensureBudgetLineAllowsPayments(budgetLine);

  return budgetLine;
}

export async function assertBudgetLineReopenableInEvent(args: {
  budgetLineId: string;
  eventId: string;
}) {
  const budgetLine = await prisma.budgetLine.findFirst({
    where: {
      id: args.budgetLineId,
      budget: {
        eventId: args.eventId,
      },
    },
    select: {
      id: true,
      sourcingStatus: true,
      selectedQuoteId: true,
      quotes: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!budgetLine) {
    throw new Error("Ligne budgetaire introuvable");
  }

  ensureBudgetLineCanBeReopened(budgetLine);

  return budgetLine;
}
