import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import {
  getSharedBudget,
  saveExpense,
  deleteExpense,
  recordRepayment,
  cancelRepayment,
} from "@/features/budget/shared/server/ledger";
import { calculateBalances } from "@/features/budget/shared/calculations";

if (process.env.NALKA_TEST_DATABASE !== "1")
  throw new Error("Shared budget smoke requires an explicit fixture database.");
const prisma = new PrismaClient();
const baseUrl = process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000";
const suffix = randomUUID();
const users: Array<{ id: string; name: string | null; session: string }> = [];
const eventIds: string[] = [];

async function get(path: string, user?: (typeof users)[number]) {
  return fetch(new URL(path, baseUrl), {
    redirect: "manual",
    headers: user ? { cookie: `next-auth.session-token=${user.session}` } : undefined,
  });
}
async function participantUser(name: string) {
  const user = await prisma.user.create({
    data: { name, email: `ci-budget-${name}-${suffix}@nalka.local`, emailVerified: new Date() },
  });
  const session = randomUUID();
  await prisma.session.create({
    data: { userId: user.id, sessionToken: session, expires: new Date(Date.now() + 30 * 60_000) },
  });
  const result = { ...user, session };
  users.push(result);
  return result;
}

async function main() {
  const owner = await participantUser("Owner");
  const alice = await participantUser("Alice");
  const bob = await participantUser("Bob");
  const outsider = await participantUser("Outsider");
  const event = await prisma.event.create({
    data: {
      slug: `ci-shared-budget-${suffix}`,
      title: "CI shared ski budget",
      ownerId: owner.id,
      memberships: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: alice.id, role: "MEMBER" },
          { userId: bob.id, role: "MEMBER" },
        ],
      },
      modules: {
        create: [
          { key: "OVERVIEW", enabled: true, position: 0 },
          { key: "BUDGET", enabled: true, position: 1 },
        ],
      },
      budget: {
        create: {
          totalBudget: 5000,
          setupStatus: "STARTED",
          lines: { create: { label: "Preserved venue", category: "VENUE", targetAmount: 1200 } },
        },
      },
    },
  });
  eventIds.push(event.id);
  const relative = await prisma.eventRelative.create({
    data: { eventId: event.id, createdById: alice.id, firstName: "Invité" },
  });
  const budget = await getSharedBudget(event.slug, alice.id);
  const byUser = (id: string) => budget.participants.find((p) => p.userId === id)!.id;
  const a = byUser(alice.id);
  const b = byUser(bob.id);
  const o = byUser(owner.id);
  const guest = budget.participants.find((p) => p.userId === null)!;
  assert.equal(budget.myParticipantId, a);
  assert.equal(budget.participants.length, 4);
  assert.ok(budget.controlledParticipantIds.includes(guest.id));
  assert.equal(
    (await get(`/event/${event.slug}/budget`, alice)).status,
    200,
    "Budget must be visible to regular members",
  );
  const memberPage = await (await get(`/event/${event.slug}/budget`, alice)).text();
  assert.ok(memberPage.includes("Ajouter une dépense"));
  assert.ok(
    !memberPage.includes("Preserved venue"),
    "Provider financial data must not leak to regular members",
  );
  assert.equal((await get(`/event/${event.slug}/budget/providers`, alice)).status, 404);
  assert.equal((await get(`/event/${event.slug}/budget/providers`, owner)).status, 200);
  assert.equal((await get(`/api/events/${event.slug}/expenses`)).status, 401);
  assert.equal((await get(`/api/events/${event.slug}/expenses`, outsider)).status, 404);
  await assert.rejects(getSharedBudget(event.slug, outsider.id));

  const expense = {
    id: randomUUID(),
    description: "Courses du chalet",
    amountCents: 2500,
    payerId: a,
    participantIds: [a, b, o],
  };
  await assert.rejects(saveExpense(event.slug, outsider.id, expense));
  const added = await saveExpense(event.slug, alice.id, expense);
  assert.equal(added.mine.paidCents, 2500);
  assert.equal(
    added.expenses[0].shares.reduce((sum, s) => sum + s.amountCents, 0),
    2500,
  );
  await saveExpense(event.slug, alice.id, expense);
  assert.equal(
    await prisma.sharedExpense.count({ where: { eventId: event.id } }),
    1,
    "Retried creation must be idempotent",
  );
  await assert.rejects(saveExpense(event.slug, alice.id, { ...expense, amountCents: 2600 }));
  await assert.rejects(
    saveExpense(event.slug, bob.id, { ...expense, version: 1, amountCents: 2600 }),
  );
  await assert.rejects(deleteExpense(event.slug, bob.id, expense.id, 1));

  const otherEvent = await prisma.event.create({
    data: { slug: `ci-other-budget-${suffix}`, title: "Other event", ownerId: owner.id },
  });
  eventIds.push(otherEvent.id);
  const foreign = await prisma.sharedBudgetParticipant.create({
    data: { eventId: otherEvent.id, userId: owner.id, name: "Foreign" },
  });
  await assert.rejects(
    saveExpense(event.slug, alice.id, {
      ...expense,
      id: randomUUID(),
      participantIds: [foreign.id],
    }),
  );
  await assert.rejects(
    prisma.sharedExpenseShare.create({
      data: { expenseId: expense.id, eventId: event.id, participantId: foreign.id, amountCents: 1 },
    }),
    "Database must reject cross-event shares too",
  );

  const edits = await Promise.allSettled([
    saveExpense(event.slug, alice.id, { ...expense, version: 1, amountCents: 3000 }),
    saveExpense(event.slug, owner.id, { ...expense, version: 1, amountCents: 3300 }),
  ]);
  assert.equal(
    edits.filter((r) => r.status === "fulfilled").length,
    1,
    "Only one stale edit may win",
  );
  const edited = await getSharedBudget(event.slug, alice.id);
  assert.equal(edited.expenses[0].version, 2);
  const bTransfer = edited.transfers.find((t) => t.fromId === b)!;
  assert.ok(bTransfer);
  const payment = { ...bTransfer, id: randomUUID() };
  const concurrent = await Promise.allSettled([
    recordRepayment(event.slug, bob.id, payment),
    recordRepayment(event.slug, bob.id, { ...payment, id: randomUUID() }),
  ]);
  assert.equal(
    concurrent.filter((r) => r.status === "fulfilled").length,
    1,
    "Concurrent repayments cannot overpay",
  );
  const afterPayment = await getSharedBudget(event.slug, bob.id);
  assert.equal(afterPayment.mine.balanceCents, 0);
  const paid = afterPayment.repayments.find((r) => !r.cancelledAt)!;
  await recordRepayment(event.slug, bob.id, {
    id: paid.id,
    fromId: paid.fromId,
    toId: paid.toId,
    amountCents: paid.amountCents,
  });
  assert.equal(await prisma.sharedRepayment.count({ where: { eventId: event.id } }), 1);
  await assert.rejects(cancelRepayment(event.slug, outsider.id, paid.id));
  await cancelRepayment(event.slug, bob.id, paid.id);
  assert.ok((await getSharedBudget(event.slug, bob.id)).mine.balanceCents < 0);
  await deleteExpense(event.slug, alice.id, expense.id, 2);
  assert.equal((await getSharedBudget(event.slug, alice.id)).mine.balanceCents, 0);

  const personal = {
    id: randomUUID(),
    description: "Mon forfait",
    amountCents: 20000,
    payerId: a,
    participantIds: [a],
  };
  const forGuest = {
    id: randomUUID(),
    description: "Repas de l’invité",
    amountCents: 1600,
    payerId: a,
    participantIds: [guest.id],
  };
  await saveExpense(event.slug, alice.id, personal);
  await saveExpense(event.slug, alice.id, forGuest);
  await prisma.eventRelative.delete({ where: { id: relative.id } });
  await prisma.eventMember.delete({
    where: { userId_eventId: { userId: bob.id, eventId: event.id } },
  });
  const retained = await getSharedBudget(event.slug, alice.id);
  assert.equal(
    retained.expenses.length,
    3,
    "Financial history survives departures and deletion of an accountless participant",
  );
  assert.equal(retained.participants.find((p) => p.id === guest.id)?.active, false);
  assert.equal(retained.participants.find((p) => p.id === b)?.active, false);
  assert.equal(retained.mine.balanceCents, 1600);
  assert.equal(
    [...calculateBalances(retained.expenses, retained.repayments).values()].reduce(
      (sum, n) => sum + n,
      0,
    ),
    0,
  );
  const json = await (await get(`/api/events/${event.slug}/expenses`, alice)).json();
  assert.equal(json.expenses.length, 3, "Another browser sees the current history immediately");
  assert.equal(
    json.participants.some((p: { name: string }) => p.name === "Foreign"),
    false,
  );
  await prisma.eventModule.update({
    where: { eventId_key: { eventId: event.id, key: "BUDGET" } },
    data: { enabled: false },
  });
  await assert.rejects(getSharedBudget(event.slug, alice.id));
  await assert.rejects(saveExpense(event.slug, alice.id, { ...personal, id: randomUUID() }));
  assert.equal((await get(`/api/events/${event.slug}/expenses`, alice)).status, 404);
  assert.equal((await get(`/event/${event.slug}/budget`, alice)).status, 404);
  console.log(
    "Shared budget smoke passed: members, provider isolation, cents, idempotency, concurrent writes/refunds, event isolation, history preservation, live API and disabled-module guards.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    await prisma.$disconnect();
  });
