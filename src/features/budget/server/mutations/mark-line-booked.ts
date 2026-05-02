"use server";

import {
  markLineBookedSchema,
  type BudgetPaymentMutationResult,
} from "@/features/budget/lib/payment-entry-form";
import { assertBudgetLineBookableInEvent } from "@/features/budget/server/invariants";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { buildMarkBookedUpdate } from "@/features/budget/server/workflow";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markLineBooked(input: unknown): Promise<BudgetPaymentMutationResult> {
  const parsed = markLineBookedSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: "Demande de reservation invalide.",
    };
  }

  const { eventSlug, budgetLineId } = parsed.data;
  const accessResult = await resolveWritableBudgetAccess(() => requireWritableBudgetAccess(eventSlug));
  if (!accessResult.ok) {
    return {
      ok: false,
      formError: accessResult.formError,
    };
  }
  const access = accessResult.access;

  try {
    await assertBudgetLineBookableInEvent({
      budgetLineId,
      eventId: access.event.id,
    });
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : "Impossible de marquer la ligne comme reservee.",
    };
  }

  await prisma.budgetLine.update({
    where: { id: budgetLineId },
    data: buildMarkBookedUpdate(),
  });

  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
  revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);

  return { ok: true };
}
