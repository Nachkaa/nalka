"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import {
  cancelRepayment,
  deleteExpense,
  recordRepayment,
  saveExpense,
  SharedBudgetError,
} from "@/features/budget/shared/server/ledger";
import type { SharedBudgetResult } from "@/features/budget/shared/types";

async function action(
  operation: (userId: string) => Promise<Extract<SharedBudgetResult, { ok: true }>["data"]>,
): Promise<SharedBudgetResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Reconnectez-vous pour accéder au budget." };
  try {
    return { ok: true, data: await operation(user.userId) };
  } catch (error) {
    if (error instanceof z.ZodError)
      return { ok: false, error: error.issues[0]?.message ?? "Vérifiez les informations saisies." };
    if (error instanceof SharedBudgetError) return { ok: false, error: error.message };
    console.error(
      "[SHARED_BUDGET] Operation failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return {
      ok: false,
      error: "L’opération n’a pas pu être confirmée. Réessayez sans fermer le formulaire.",
    };
  }
}

export async function saveSharedExpense(slug: string, input: unknown) {
  return action((userId) => saveExpense(slug, userId, input));
}
export async function deleteSharedExpense(slug: string, input: unknown) {
  return action((userId) => {
    const data = z.object({ id: z.uuid(), version: z.number().int().positive() }).parse(input);
    return deleteExpense(slug, userId, data.id, data.version);
  });
}
export async function recordSharedRepayment(slug: string, input: unknown) {
  return action((userId) => recordRepayment(slug, userId, input));
}
export async function cancelSharedRepayment(slug: string, input: unknown) {
  return action((userId) => cancelRepayment(slug, userId, z.uuid().parse(input)));
}
