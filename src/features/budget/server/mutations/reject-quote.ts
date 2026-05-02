"use server";

import { quoteDecisionSchema, type QuoteDecisionResult } from "@/features/budget/lib/quote-decision-form";
import {
  assertQuoteCanBeRejected,
  assertQuoteInEventChain,
} from "@/features/budget/server/invariants";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { buildRejectQuoteUpdate } from "@/features/budget/server/workflow";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function rejectQuote(input: unknown): Promise<QuoteDecisionResult> {
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
    assertQuoteCanBeRejected(quote);
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : "Impossible de refuser ce devis.",
    };
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: buildRejectQuoteUpdate(decisionNote),
  });

  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
  revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);

  return { ok: true };
}
