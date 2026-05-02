"use server";

import { quoteDecisionSchema, type QuoteDecisionResult } from "@/features/budget/lib/quote-decision-form";
import { assertBudgetLineReopenableInEvent } from "@/features/budget/server/invariants";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { buildReopenSelectedLineTransaction } from "@/features/budget/server/workflow";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function reopenSelectedLine(input: unknown): Promise<QuoteDecisionResult> {
  const parsed = quoteDecisionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      formError: "Corrigez les champs invalides.",
      fieldErrors: {
        quoteId: fieldErrors.quoteId?.[0],
        decisionNote: fieldErrors.decisionNote?.[0],
      },
    };
  }

  const { eventSlug, budgetLineId, quoteId, decisionNote } = parsed.data;
  const accessResult = await resolveWritableBudgetAccess(() => requireWritableBudgetAccess(eventSlug));
  if (!accessResult.ok) {
    return {
      ok: false,
      formError: accessResult.formError,
    };
  }
  const access = accessResult.access;

  let budgetLine;
  try {
    budgetLine = await assertBudgetLineReopenableInEvent({
      budgetLineId,
      eventId: access.event.id,
    });
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : "Impossible de rouvrir l'evaluation.",
    };
  }

  if (budgetLine.selectedQuoteId !== quoteId) {
    return {
      ok: false,
      formError: "Seul le devis actuellement retenu peut etre rouvert.",
    };
  }

  const receivedQuotesCount = budgetLine.quotes.filter(
    (quote) => quote.status === "RECEIVED" || quote.id === quoteId,
  ).length;
  const awaitingResponseQuotesCount = budgetLine.quotes.filter(
    (quote) => quote.status === "AWAITING_RESPONSE",
  ).length;

  const transaction = buildReopenSelectedLineTransaction({
    budgetLineId,
    selectedQuoteId: quoteId,
    decisionNote,
    receivedQuotesCount,
    awaitingResponseQuotesCount,
  });

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: transaction.reopenQuoteWhere,
      data: transaction.reopenQuoteData,
    });

    await tx.budgetLine.update({
      where: transaction.updateLineWhere,
      data: transaction.updateLineData,
    });
  });

  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
  revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);

  return { ok: true };
}
