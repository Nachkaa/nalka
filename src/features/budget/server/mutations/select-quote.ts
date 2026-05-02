"use server";

import { quoteDecisionSchema, type QuoteDecisionResult } from "@/features/budget/lib/quote-decision-form";
import {
  assertQuoteCanBeSelected,
  assertQuoteInEventChain,
} from "@/features/budget/server/invariants";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { buildSelectQuoteTransaction } from "@/features/budget/server/workflow";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function selectQuote(input: unknown): Promise<QuoteDecisionResult> {
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

  let quote;
  try {
    quote = await assertQuoteInEventChain({
      quoteId,
      budgetLineId,
      eventId: access.event.id,
    });
    assertQuoteCanBeSelected(quote);
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : "Impossible de retenir ce devis.",
    };
  }

  const transaction = buildSelectQuoteTransaction({
    budgetLineId,
    quoteId,
    decisionNote,
  });

  await prisma.$transaction(async (tx) => {
    await tx.quote.updateMany({
      where: transaction.demoteSelectedWhere,
      data: transaction.demoteSelectedData,
    });

    await tx.quote.update({
      where: transaction.selectQuoteWhere,
      data: transaction.selectQuoteData,
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
