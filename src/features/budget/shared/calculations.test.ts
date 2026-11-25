import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateBalances, simplifyTransfers, splitEqually } from "./calculations";
import { parseEuroAmount, SharedExpenseInput } from "./forms";
import type { SharedTransfer } from "./types";

function settled(balances: ReadonlyMap<string, number>, transfers: SharedTransfer[]) {
  const remaining = new Map(balances);
  for (const t of transfers) {
    assert.ok(Number.isSafeInteger(t.amountCents) && t.amountCents > 0);
    assert.notEqual(t.fromId, t.toId);
    remaining.set(t.fromId, (remaining.get(t.fromId) ?? 0) + t.amountCents);
    remaining.set(t.toId, (remaining.get(t.toId) ?? 0) - t.amountCents);
  }
  assert.ok([...remaining.values()].every((v) => v === 0));
}

// Independent oracle: maximize disjoint zero-sum subsets. Each subset needs n - 1 transfers.
function minimumCount(values: number[]) {
  const v = values.filter(Boolean);
  const sums = Array<number>(1 << v.length).fill(0);
  const groups = Array<number>(sums.length).fill(-Infinity);
  groups[0] = 0;
  for (let mask = 1; mask < sums.length; mask++) {
    const bit = mask & -mask;
    sums[mask] = sums[mask ^ bit] + v[Math.log2(bit)];
    for (let sub = mask; sub > 0; sub = (sub - 1) & mask) {
      if (sub & bit && sums[sub] === 0)
        groups[mask] = Math.max(groups[mask], 1 + groups[mask ^ sub]);
    }
  }
  return v.length - groups.at(-1)!;
}

test("25 euros for three people is split without losing or creating a cent", () => {
  assert.deepEqual(splitEqually(2500, ["C", "A", "B"]), [
    { participantId: "A", amountCents: 834 },
    { participantId: "B", amountCents: 833 },
    { participantId: "C", amountCents: 833 },
  ]);
  assert.deepEqual(splitEqually(1, ["B", "A"]), [
    { participantId: "A", amountCents: 1 },
    { participantId: "B", amountCents: 0 },
  ]);
  assert.throws(() => splitEqually(0, ["A"]));
  assert.throws(() => splitEqually(100, []));
});

test("the payer need not be a beneficiary and circular debts cancel globally", () => {
  const balances = calculateBalances(
    [
      { payerId: "A", amountCents: 2500, shares: splitEqually(2500, ["B", "C"]) },
      { payerId: "B", amountCents: 1000, shares: splitEqually(1000, ["C"]) },
      { payerId: "C", amountCents: 1000, shares: splitEqually(1000, ["B"]) },
    ],
    [],
  );
  assert.deepEqual(
    [...balances],
    [
      ["A", 2500],
      ["B", -1250],
      ["C", -1250],
    ],
  );
  settled(balances, simplifyTransfers(balances).transfers);
});

test("finds the true minimum when largest-first greedy would need four transfers", () => {
  const balances = new Map([
    ["A", -800],
    ["B", -700],
    ["C", -600],
    ["D", 1300],
    ["E", 800],
  ]);
  const optimized = simplifyTransfers(balances);
  assert.equal(optimized.optimal, true);
  assert.equal(optimized.transfers.length, 3);
  settled(balances, optimized.transfers);
  const fallback = simplifyTransfers(balances, { maxNodes: 0 });
  assert.equal(fallback.optimal, false);
  assert.equal(fallback.transfers.length, 4);
  settled(balances, fallback.transfers);
});

test("recorded repayments reduce debts; cancellation and expense deletion reverse them", () => {
  const expense = { payerId: "A", amountCents: 2000, shares: splitEqually(2000, ["A", "B"]) };
  const repayment = { fromId: "B", toId: "A", amountCents: 1000 };
  assert.ok([...calculateBalances([expense], [repayment]).values()].every((v) => v === 0));
  assert.equal(
    calculateBalances([expense], [{ ...repayment, cancelledAt: new Date() }]).get("B"),
    -1000,
  );
  assert.equal(
    calculateBalances([{ ...expense, deletedAt: new Date() }], [repayment]).get("B"),
    1000,
  );
  assert.throws(() => calculateBalances([{ ...expense, shares: [] }], []));
});

test("small-group optimizer matches exhaustive zero-sum partitions and conserves every cent", () => {
  let seed = 1789;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  for (let attempt = 0; attempt < 200; attempt++) {
    const values = Array.from({ length: 2 + (random() % 6) }, () => (random() % 25) - 12);
    values.push(-values.reduce((sum, v) => sum + v, 0));
    const balances = new Map(values.map((v, i) => [String(i), v]));
    const result = simplifyTransfers(balances);
    assert.equal(result.optimal, true);
    assert.equal(result.transfers.length, minimumCount(values), JSON.stringify(values));
    settled(balances, result.transfers);
  }
});

test("larger groups retain valid settlements without a false optimality claim", () => {
  const balances = new Map(
    Array.from({ length: 40 }, (_, i) => [String(i), i < 20 ? -(i + 1) : i - 19]),
  );
  const result = simplifyTransfers(balances);
  settled(balances, result.transfers);
  assert.throws(() => simplifyTransfers(new Map([["A", 1]])));
});

test("currency parsing accepts French decimals and rejects imprecise or unsafe input", () => {
  for (const [text, cents] of [
    ["25", 2500],
    ["25,10", 2510],
    ["0,01", 1],
    ["1 250.50", 125050],
  ] as const)
    assert.equal(parseEuroAmount(text), cents);
  for (const text of ["", "0", "-1", "NaN", "1e2", "2,555", "1.2.3", "1000001"])
    assert.equal(parseEuroAmount(text), null);
  const input = {
    id: "7ebbd2dd-dba0-4551-88a4-c0296e9cad9e",
    description: "Courses",
    payerId: "A",
    amountCents: 2500,
    participantIds: ["A"],
  };
  assert.ok(SharedExpenseInput.safeParse(input).success);
  for (const patch of [
    { description: " " },
    { amountCents: 1.1 },
    { participantIds: [] },
    { participantIds: ["A", "A"] },
  ])
    assert.equal(SharedExpenseInput.safeParse({ ...input, ...patch }).success, false);
});
