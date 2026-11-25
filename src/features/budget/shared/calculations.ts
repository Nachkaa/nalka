import type { SharedTransfer } from "./types";

type Expense = {
  payerId: string;
  amountCents: number;
  deletedAt?: unknown;
  shares: Array<{ participantId: string; amountCents: number }>;
};
type Repayment = SharedTransfer & { cancelledAt?: unknown };

export function splitEqually(amountCents: number, participantIds: readonly string[]) {
  const ids = [...new Set(participantIds)].sort();
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || ids.length === 0) {
    throw new Error("Une dépense nécessite un montant positif et au moins une personne.");
  }
  const base = Math.floor(amountCents / ids.length);
  const remainder = amountCents % ids.length;
  return ids.map((participantId, index) => ({
    participantId,
    amountCents: base + (index < remainder ? 1 : 0),
  }));
}

export function calculateBalances(expenses: readonly Expense[], repayments: readonly Repayment[]) {
  const balances = new Map<string, number>();
  function add(id: string, amount: number) {
    if (!Number.isSafeInteger(amount)) throw new Error("Montant invalide.");
    const next = (balances.get(id) ?? 0) + amount;
    if (!Number.isSafeInteger(next)) throw new Error("Solde trop élevé.");
    balances.set(id, next);
  }
  for (const expense of expenses) {
    if (expense.deletedAt) continue;
    if (expense.shares.reduce((sum, share) => sum + share.amountCents, 0) !== expense.amountCents) {
      throw new Error("La répartition ne correspond pas au montant de la dépense.");
    }
    add(expense.payerId, expense.amountCents);
    for (const share of expense.shares) add(share.participantId, -share.amountCents);
  }
  for (const repayment of repayments) {
    if (repayment.cancelledAt) continue;
    add(repayment.fromId, repayment.amountCents);
    add(repayment.toId, -repayment.amountCents);
  }
  return balances;
}

/** Net all debts first. Bound the exact search so a large group cannot stall a request. */
export function simplifyTransfers(
  input: ReadonlyMap<string, number>,
  options: { maxNodes?: number; maxExactParticipants?: number } = {},
): { transfers: SharedTransfer[]; optimal: boolean } {
  const entries = [...input]
    .filter(([, balance]) => balance !== 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (
    entries.some(([, value]) => !Number.isSafeInteger(value)) ||
    entries.reduce((sum, [, value]) => sum + value, 0) !== 0
  ) {
    throw new Error("Les soldes doivent être entiers et équilibrés.");
  }
  const ids = entries.map(([id]) => id);
  const amounts = entries.map(([, amount]) => amount);
  const transfer = (i: number, j: number, amountCents: number): SharedTransfer => ({
    fromId: amounts[i] < 0 ? ids[i] : ids[j],
    toId: amounts[i] < 0 ? ids[j] : ids[i],
    amountCents,
  });
  const greedy = [...amounts];
  let best: SharedTransfer[] = [];
  while (true) {
    let debtor = -1;
    let creditor = -1;
    for (let i = 0; i < greedy.length; i++) {
      if (greedy[i] < 0 && (debtor < 0 || greedy[i] < greedy[debtor])) debtor = i;
      if (greedy[i] > 0 && (creditor < 0 || greedy[i] > greedy[creditor])) creditor = i;
    }
    if (debtor < 0 || creditor < 0) break;
    const amount = Math.min(-greedy[debtor], greedy[creditor]);
    best.push({ fromId: ids[debtor], toId: ids[creditor], amountCents: amount });
    greedy[debtor] += amount;
    greedy[creditor] -= amount;
  }
  const lowerBound = Math.max(
    amounts.filter((v) => v < 0).length,
    amounts.filter((v) => v > 0).length,
  );
  if (best.length === lowerBound) return { transfers: best, optimal: true };
  if (entries.length > (options.maxExactParticipants ?? 18))
    return { transfers: best, optimal: false };

  let nodes = 0;
  let exhausted = false;
  const memo = new Map<string, number>();
  const path: SharedTransfer[] = [];
  function search() {
    if (++nodes > (options.maxNodes ?? 100_000)) {
      exhausted = true;
      return;
    }
    const nonzero = amounts.filter((v) => v !== 0);
    if (nonzero.length === 0) {
      if (path.length < best.length) best = [...path];
      return;
    }
    const bound = Math.max(
      nonzero.filter((v) => v < 0).length,
      nonzero.filter((v) => v > 0).length,
    );
    if (path.length + bound >= best.length) return;
    const key = nonzero.sort((a, b) => a - b).join(",");
    if ((memo.get(key) ?? Infinity) <= path.length) return;
    memo.set(key, path.length);
    const i = amounts.findIndex((v) => v !== 0);
    const opponents = amounts
      .map((v, j) => ({ v, j }))
      .filter(({ v }) => v * amounts[i] < 0)
      .sort((a, b) => Number(b.v === -amounts[i]) - Number(a.v === -amounts[i]));
    const seen = new Set<number>();
    for (const { v, j } of opponents) {
      if (seen.has(v)) continue;
      seen.add(v);
      const amount = Math.min(Math.abs(amounts[i]), Math.abs(v));
      const beforeI = amounts[i];
      const beforeJ = amounts[j];
      path.push(transfer(i, j, amount));
      const direction = Math.sign(beforeI);
      amounts[i] -= direction * amount;
      amounts[j] += direction * amount;
      search();
      amounts[i] = beforeI;
      amounts[j] = beforeJ;
      path.pop();
      if (exhausted || best.length === lowerBound) break;
    }
  }
  search();
  return { transfers: best, optimal: !exhausted || best.length === lowerBound };
}
