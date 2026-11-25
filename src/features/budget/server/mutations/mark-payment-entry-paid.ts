"use server";

import { PaymentLogAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  markPaymentEntryPaidSchema,
  type BudgetPaymentMutationResult,
} from "@/features/budget/lib/payment-entry-form";
import { assertPaymentEntryInEventChain } from "@/features/budget/server/invariants";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { resolvePaidAtOverride } from "@/features/budget/server/workflow";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";

export async function markPaymentEntryPaid(input: unknown): Promise<BudgetPaymentMutationResult> {
  const parsed = markPaymentEntryPaidSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      formError: "Corrigez les champs invalides.",
      fieldErrors: {
        paidAt: fieldErrors.paidAt?.[0],
      },
    };
  }

  const { eventSlug, budgetLineId, paymentEntryId, paidAt } = parsed.data;
  const accessResult = await resolveWritableBudgetAccess(() => requireWritableBudgetAccess(eventSlug));
  if (!accessResult.ok) {
    return {
      ok: false,
      formError: accessResult.formError,
    };
  }
  const access = accessResult.access;

  let paymentEntry;
  try {
    paymentEntry = await assertPaymentEntryInEventChain({
      paymentEntryId,
      budgetLineId,
      eventId: access.event.id,
    });
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : "Impossible de marquer cette echeance comme reglee.",
    };
  }

  if (!paymentEntry.paidAt) {
    const newPaidAt = resolvePaidAtOverride(paidAt, new Date());
    await prisma.$transaction(async (tx) => {
      await tx.paymentEntry.update({
        where: { id: paymentEntryId },
        data: { paidAt: newPaidAt },
      });
      await tx.paymentLog.create({
        data: {
          paymentEntryId,
          userId: access.userId,
          action: PaymentLogAction.MARKED_PAID,
          previousPaidAt: null,
          newPaidAt,
        },
      });
    });
  }

  revalidatePath(`/event/${eventSlug}/budget/providers`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
  revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);

  return { ok: true };
}
