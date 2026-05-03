"use server";

import {
  createPaymentEntrySchema,
  normalizeMoneyInput,
  normalizeOptionalString,
  type BudgetPaymentMutationResult,
} from "@/features/budget/lib/payment-entry-form";
import { BUDGET_DEFAULT_CURRENCY } from "@/features/budget/lib/constants";
import { formatMoney } from "@/features/budget/lib/serializers";
import {
  assertBudgetLineAllowsPayments,
  assertQuoteInEventChain,
  checkPaymentAmountWithinCommitted,
} from "@/features/budget/server/invariants";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { buildPaymentEntryCreateData } from "@/features/budget/server/workflow";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

class OverPaymentError extends Error {
  constructor(
    readonly committed: string,
    readonly projected: string,
  ) {
    super("OVER_PAYMENT");
  }
}

export async function createPaymentEntry(input: unknown): Promise<BudgetPaymentMutationResult> {
  const parsed = createPaymentEntrySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      formError: "Corrigez les champs invalides.",
      fieldErrors: {
        quoteId: fieldErrors.quoteId?.[0],
        label: fieldErrors.label?.[0],
        entryType: fieldErrors.entryType?.[0],
        amount: fieldErrors.amount?.[0],
        dueDate: fieldErrors.dueDate?.[0],
        note: fieldErrors.note?.[0],
      },
    };
  }

  const { eventSlug, budgetLineId, quoteId, label, entryType, amount, dueDate, note } = parsed.data;
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
    budgetLine = await assertBudgetLineAllowsPayments({
      budgetLineId,
      eventId: access.event.id,
    });
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : "Impossible d'ajouter l'echeance de paiement.",
    };
  }

  const resolvedQuoteId = quoteId || budgetLine.selectedQuoteId!;

  if (resolvedQuoteId) {
    try {
      await assertQuoteInEventChain({
        quoteId: resolvedQuoteId,
        budgetLineId,
        eventId: access.event.id,
      });
    } catch (error) {
      return {
        ok: false,
        formError: error instanceof Error ? error.message : "Reference de devis invalide.",
      };
    }
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const amountCheck = await checkPaymentAmountWithinCommitted(tx, {
          budgetLineId,
          newAmountDecimal: normalizeMoneyInput(amount),
        });
        if (!amountCheck.ok) {
          throw new OverPaymentError(amountCheck.committed, amountCheck.projected);
        }
        await tx.paymentEntry.create({
          data: buildPaymentEntryCreateData({
            budgetLineId,
            quoteId: resolvedQuoteId || null,
            label,
            entryType,
            amount: normalizeMoneyInput(amount),
            dueDate: new Date(dueDate),
            note: normalizeOptionalString(note),
          }),
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof OverPaymentError) {
      const projected = formatMoney(error.projected, BUDGET_DEFAULT_CURRENCY);
      const committed = formatMoney(error.committed, BUDGET_DEFAULT_CURRENCY);
      return {
        ok: false,
        fieldErrors: {
          amount: `Le montant cumulé (${projected}) dépasserait le montant engagé (${committed})`,
        },
      };
    }
    throw error;
  }

  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
  revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);

  return { ok: true };
}
