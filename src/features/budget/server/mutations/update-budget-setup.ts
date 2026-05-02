"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";

const setupBudgetSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("define"),
    eventSlug: z.string().trim().min(1),
    totalBudget: z
      .string()
      .trim()
      .min(1, "Le budget global est requis")
      .refine((value) => !Number.isNaN(Number(value)), "Le budget global doit etre valide")
      .refine((value) => Number(value) > 0, "Le budget global doit etre superieur a 0"),
  }),
  z.object({
    intent: z.literal("skip"),
    eventSlug: z.string().trim().min(1),
  }),
]);

type SetupBudgetInput = z.infer<typeof setupBudgetSchema>;

export type BudgetSetupMutationResult = {
  ok: boolean;
  formError?: string;
  fieldErrors?: {
    totalBudget?: string;
  };
};

function revalidateBudgetPaths(eventSlug: string) {
  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
}

export async function updateBudgetSetup(
  input: SetupBudgetInput,
): Promise<BudgetSetupMutationResult> {
  const parsed = setupBudgetSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const totalBudgetFieldErrors =
      "totalBudget" in fieldErrors ? fieldErrors.totalBudget : undefined;
    return {
      ok: false,
      formError: "Corrigez les champs invalides.",
      fieldErrors: {
        totalBudget: totalBudgetFieldErrors?.[0],
      },
    };
  }

  const accessResult = await resolveWritableBudgetAccess(() =>
    requireWritableBudgetAccess(parsed.data.eventSlug),
  );
  if (!accessResult.ok) {
    return {
      ok: false,
      formError: accessResult.formError,
    };
  }

  const { access } = accessResult;

  await prisma.budget.update({
    where: { id: access.budget.id },
    data:
      parsed.data.intent === "define"
        ? {
            setupStatus: "STARTED",
            totalBudget: Number(parsed.data.totalBudget).toFixed(2),
          }
        : {
            setupStatus: "STARTED",
          },
  });

  revalidateBudgetPaths(parsed.data.eventSlug);
  return { ok: true };
}
