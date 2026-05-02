"use server";

import {
  normalizeMoneyInput,
  updateBudgetLineSchema,
  type BudgetLineMutationResult,
} from "@/features/budget/lib/budget-line-form";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateBudgetLine(input: unknown): Promise<BudgetLineMutationResult> {
  const parsed = updateBudgetLineSchema.safeParse(input);

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
        sourcingStatus: fieldErrors.sourcingStatus?.[0],
      },
    };
  }

  const {
    eventSlug,
    budgetLineId,
    category,
    label,
    targetAmount,
    estimatedAmount,
    internalNote,
    sourcingStatus,
  } = parsed.data;
  const accessResult = await resolveWritableBudgetAccess(() => requireWritableBudgetAccess(eventSlug));
  if (!accessResult.ok) {
    return {
      ok: false,
      formError: accessResult.formError,
    };
  }
  const access = accessResult.access;

  const existingLine = await prisma.budgetLine.findFirst({
    where: {
      id: budgetLineId,
      budgetId: access.budget.id,
    },
    select: {
      id: true,
      sourcingStatus: true,
    },
  });

  if (!existingLine) {
    return { ok: false, formError: "Ligne budgetaire introuvable." };
  }

  if (existingLine.sourcingStatus !== "DRAFT" && existingLine.sourcingStatus !== "SOURCING") {
    return {
      ok: false,
      formError: "Seules les lignes en brouillon ou en consultation peuvent etre modifiees a cette etape.",
    };
  }

  await prisma.budgetLine.update({
    where: { id: existingLine.id },
    data: {
      category,
      label,
      targetAmount: normalizeMoneyInput(targetAmount),
      estimatedAmount: estimatedAmount ? normalizeMoneyInput(estimatedAmount) : null,
      internalNote: internalNote || null,
      sourcingStatus,
    },
  });

  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
  revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);

  return { ok: true };
}
