"use server";

import {
  createBudgetLineSchema,
  normalizeMoneyInput,
  type BudgetLineMutationResult,
} from "@/features/budget/lib/budget-line-form";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBudgetLine(input: unknown): Promise<BudgetLineMutationResult> {
  const parsed = createBudgetLineSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      formError: "Corrigez les champs invalides.",
      fieldErrors: {
        category: fieldErrors.category?.[0],
        label: fieldErrors.label?.[0],
        targetAmount: fieldErrors.targetAmount?.[0],
        estimatedAmount: fieldErrors.estimatedAmount?.[0],
        internalNote: fieldErrors.internalNote?.[0],
      },
    };
  }

  const { eventSlug, category, label, targetAmount, estimatedAmount, internalNote } = parsed.data;
  const accessResult = await resolveWritableBudgetAccess(() => requireWritableBudgetAccess(eventSlug));
  if (!accessResult.ok) {
    return {
      ok: false,
      formError: accessResult.formError,
    };
  }
  const access = accessResult.access;

  await prisma.$transaction([
    prisma.budget.update({
      where: { id: access.budget.id },
      data: { setupStatus: "STARTED" },
    }),
    prisma.budgetLine.create({
      data: {
        budgetId: access.budget.id,
        category,
        label,
        targetAmount: normalizeMoneyInput(targetAmount),
        estimatedAmount: estimatedAmount ? normalizeMoneyInput(estimatedAmount) : null,
        internalNote: internalNote || null,
        sourcingStatus: "DRAFT",
      },
    }),
  ]);

  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);

  return { ok: true };
}
