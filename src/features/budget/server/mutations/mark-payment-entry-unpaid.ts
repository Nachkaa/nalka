"use server";

import { PaymentLogAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  markPaymentEntryUnpaidSchema,
  type BudgetPaymentMutationResult,
} from "@/features/budget/lib/payment-entry-form";
import { assertPaymentEntryInEventChain } from "@/features/budget/server/invariants";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";

export async function markPaymentEntryUnpaid(input: unknown): Promise<BudgetPaymentMutationResult> {
  const parsed = markPaymentEntryUnpaidSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: "Requête invalide.",
    };
  }

  const { eventSlug, budgetLineId, paymentEntryId } = parsed.data;
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
      formError: error instanceof Error ? error.message : "Impossible de démarquer cette échéance.",
    };
  }

  if (!paymentEntry.paidAt) {
    return { ok: true };
  }

  const previousPaidAt = paymentEntry.paidAt;
  await prisma.$transaction(async (tx) => {
    await tx.paymentEntry.update({
      where: { id: paymentEntryId },
      data: { paidAt: null },
    });
    await tx.paymentLog.create({
      data: {
        paymentEntryId,
        userId: access.userId,
        action: PaymentLogAction.MARKED_UNPAID,
        previousPaidAt,
        newPaidAt: null,
      },
    });
  });

  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
  revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);

  return { ok: true };
}
