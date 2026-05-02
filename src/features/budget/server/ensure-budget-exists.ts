import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

type EnsureBudgetOptions = {
  totalBudgetCents?: number | null;
};

/**
 * Ensures a Budget record exists for the given event.
 * Idempotent: returns existing Budget if already present, otherwise
 * creates one with sensible defaults.
 *
 * Used in two activation paths:
 * - createEvent (event/actions.ts) — Budget activated at event creation
 * - enableEventModuleFromManager (module-manager.ts) — Budget activated later
 */
export async function ensureBudgetForEvent(
  tx: Tx,
  eventId: string,
  options: EnsureBudgetOptions = {},
) {
  const existing = await tx.budget.findUnique({
    where: { eventId },
    select: { id: true },
  });
  if (existing) return existing;

  const cents = options.totalBudgetCents ?? 0;
  return tx.budget.create({
    data: {
      eventId,
      totalBudget: (cents / 100).toFixed(2),
      setupStatus: cents > 0 ? "STARTED" : "NOT_STARTED",
    },
  });
}
