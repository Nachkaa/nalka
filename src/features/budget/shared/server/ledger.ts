import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateBalances, simplifyTransfers, splitEqually } from "../calculations";
import { SharedExpenseInput, SharedRepaymentInput } from "../forms";
import type { SharedBudgetView } from "../types";

export class SharedBudgetError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

async function context(tx: Prisma.TransactionClient, slug: string, userId: string) {
  const record = await tx.event.findUnique({ where: { slug }, select: { id: true } });
  if (!record) throw new SharedBudgetError("Budget introuvable.", 404);
  // All ledger reads and writes see one consistent event, including simultaneous reimbursements.
  await tx.$queryRaw`SELECT "id" FROM "Event" WHERE "id" = ${record.id} FOR UPDATE`;
  const event = await tx.event.findFirst({
    where: {
      id: record.id,
      memberships: { some: { userId } },
      modules: { some: { key: "BUDGET", enabled: true } },
    },
    select: {
      id: true,
      slug: true,
      memberships: { select: { userId: true, role: true, user: { select: { name: true } } } },
      relatives: {
        select: {
          id: true,
          firstName: true,
          createdById: true,
          managedProfile: { select: { ownerId: true } },
        },
      },
    },
  });
  if (!event) throw new SharedBudgetError("Budget introuvable ou accès non autorisé.", 404);
  const member = event.memberships.find((m) => m.userId === userId)!;
  const previous = await tx.sharedBudgetParticipant.findMany({ where: { eventId: event.id } });
  const missing = [
    ...event.memberships
      .filter((m) => !previous.some((p) => p.userId === m.userId))
      .map((m) => ({
        eventId: event.id,
        userId: m.userId,
        relativeId: null,
        name: m.user.name?.trim() || "Participant",
      })),
    ...event.relatives
      .filter((r) => !previous.some((p) => p.relativeId === r.id))
      .map((r) => ({
        eventId: event.id,
        userId: null,
        relativeId: r.id,
        name: r.firstName,
      })),
  ];
  if (missing.length)
    await tx.sharedBudgetParticipant.createMany({ data: missing, skipDuplicates: true });
  const participants = missing.length
    ? await tx.sharedBudgetParticipant.findMany({
        where: { eventId: event.id },
        orderBy: { id: "asc" },
      })
    : previous;
  const currentUsers = new Map(
    event.memberships.map((m) => [m.userId, m.user.name?.trim() || "Participant"]),
  );
  const currentRelatives = new Map(event.relatives.map((r) => [r.id, r.firstName]));
  const currentNames = new Map(
    participants.map((p) => [
      p.id,
      (p.userId ? currentUsers.get(p.userId) : undefined) ??
        (p.relativeId ? currentRelatives.get(p.relativeId) : undefined),
    ]),
  );
  const me = participants.find((p) => p.userId === userId)!;
  const controlledIds = new Set([
    me.id,
    ...participants
      .filter((p) =>
        event.relatives.some(
          (r) => r.id === p.relativeId && (r.managedProfile?.ownerId ?? r.createdById) === userId,
        ),
      )
      .map((p) => p.id),
  ]);
  return {
    event,
    userId,
    me,
    controlledIds,
    isOrganizer: member.role === "OWNER" || member.role === "ADMIN",
    actorName: currentUsers.get(userId) ?? "Participant",
    participants: participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: currentNames.get(p.id) ?? p.name,
      active: currentNames.get(p.id) !== undefined,
    })),
  };
}
type Context = Awaited<ReturnType<typeof context>>;

async function rows(tx: Prisma.TransactionClient, eventId: string) {
  const [expenses, repayments] = await Promise.all([
    tx.sharedExpense.findMany({
      where: { eventId },
      include: { shares: { select: { participantId: true, amountCents: true } } },
      orderBy: { createdAt: "desc" },
    }),
    tx.sharedRepayment.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } }),
  ]);
  return { expenses, repayments };
}
type Rows = Awaited<ReturnType<typeof rows>>;

function canEdit(c: Context, expense: { createdById: string; payerId: string }) {
  return c.isOrganizer || expense.createdById === c.userId || c.controlledIds.has(expense.payerId);
}
function canRepay(c: Context, repayment: { fromId: string; toId: string }) {
  return (
    c.isOrganizer || c.controlledIds.has(repayment.fromId) || c.controlledIds.has(repayment.toId)
  );
}

function view(c: Context, data: Rows): SharedBudgetView {
  const balances = calculateBalances(data.expenses, data.repayments);
  const simplified = simplifyTransfers(balances);
  return {
    eventId: c.event.id,
    slug: c.event.slug,
    myParticipantId: c.me.id,
    controlledParticipantIds: [...c.controlledIds],
    participants: c.participants,
    expenses: data.expenses.map((e) => ({
      id: e.id,
      payerId: e.payerId,
      description: e.description,
      amountCents: e.amountCents,
      createdByName: e.createdByName,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      deletedAt: e.deletedAt?.toISOString() ?? null,
      version: e.version,
      canEdit: !e.deletedAt && canEdit(c, e),
      shares: e.shares,
    })),
    repayments: data.repayments.map((r) => ({
      id: r.id,
      fromId: r.fromId,
      toId: r.toId,
      amountCents: r.amountCents,
      createdByName: r.createdByName,
      createdAt: r.createdAt.toISOString(),
      cancelledAt: r.cancelledAt?.toISOString() ?? null,
      canCancel: !r.cancelledAt && canRepay(c, r),
    })),
    transfers: simplified.transfers,
    optimal: simplified.optimal,
    mine: {
      paidCents: data.expenses
        .filter((e) => !e.deletedAt && e.payerId === c.me.id)
        .reduce((sum, e) => sum + e.amountCents, 0),
      shareCents: data.expenses
        .filter((e) => !e.deletedAt)
        .reduce(
          (sum, e) =>
            sum +
            e.shares
              .filter((s) => s.participantId === c.me.id)
              .reduce((total, s) => total + s.amountCents, 0),
          0,
        ),
      balanceCents: balances.get(c.me.id) ?? 0,
    },
  };
}

type Mutation = (tx: Prisma.TransactionClient, c: Context) => Promise<void>;
async function run(slug: string, userId: string, mutation?: Mutation) {
  const snapshot = await prisma.$transaction(
    async (tx) => {
      const c = await context(tx, slug, userId);
      if (mutation) await mutation(tx, c);
      return { c, data: await rows(tx, c.event.id) };
    },
    { timeout: 15_000 },
  );
  // The optimizer must not hold database locks.
  return view(snapshot.c, snapshot.data);
}

export const getSharedBudget = (slug: string, userId: string) => run(slug, userId);

export async function saveExpense(slug: string, userId: string, input: unknown) {
  const data = SharedExpenseInput.parse(input);
  return run(slug, userId, async (tx, c) => {
    const existing = await tx.sharedExpense.findUnique({
      where: { id: data.id },
      include: { shares: true },
    });
    if (existing && existing.eventId !== c.event.id)
      throw new SharedBudgetError("Cette opération n’est pas disponible.", 409);
    if (!data.version && existing) {
      const identical =
        existing.createdById === userId &&
        !existing.deletedAt &&
        existing.description === data.description &&
        existing.amountCents === data.amountCents &&
        existing.payerId === data.payerId &&
        existing.shares
          .map((s) => s.participantId)
          .sort()
          .join(",") === [...data.participantIds].sort().join(",");
      if (identical) return;
      throw new SharedBudgetError(
        "La dépense a déjà été enregistrée. Actualisez avant de la modifier.",
        409,
      );
    }
    if (data.version && (!existing || existing.deletedAt || existing.version !== data.version)) {
      throw new SharedBudgetError("Cette dépense a changé. Actualisez avant de réessayer.", 409);
    }
    if (existing && !canEdit(c, existing))
      throw new SharedBudgetError("Vous ne pouvez modifier que vos dépenses.", 403);
    const permitted = new Set(c.participants.filter((p) => p.active).map((p) => p.id));
    if (existing) {
      permitted.add(existing.payerId);
      existing.shares.forEach((s) => permitted.add(s.participantId));
    }
    if (![data.payerId, ...data.participantIds].every((id) => permitted.has(id))) {
      throw new SharedBudgetError("Sélectionnez uniquement des participants de cet événement.");
    }
    const shares = splitEqually(data.amountCents, data.participantIds);
    if (existing) {
      await tx.sharedExpenseShare.deleteMany({ where: { expenseId: existing.id } });
      await tx.sharedExpense.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          amountCents: data.amountCents,
          payerId: data.payerId,
          version: { increment: 1 },
          shares: { create: shares },
        },
      });
    } else {
      await tx.sharedExpense.create({
        data: {
          id: data.id,
          eventId: c.event.id,
          payerId: data.payerId,
          description: data.description,
          amountCents: data.amountCents,
          createdById: userId,
          createdByName: c.actorName,
          shares: { create: shares },
        },
      });
    }
  });
}

export async function deleteExpense(slug: string, userId: string, id: string, version: number) {
  return run(slug, userId, async (tx, c) => {
    const expense = await tx.sharedExpense.findFirst({ where: { id, eventId: c.event.id } });
    if (!expense || !canEdit(c, expense))
      throw new SharedBudgetError("Dépense introuvable ou modification non autorisée.", 403);
    if (expense.deletedAt) return;
    if (expense.version !== version)
      throw new SharedBudgetError("Cette dépense a changé. Actualisez avant de réessayer.", 409);
    await tx.sharedExpense.update({
      where: { id },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });
  });
}

export async function recordRepayment(slug: string, userId: string, input: unknown) {
  const data = SharedRepaymentInput.parse(input);
  return run(slug, userId, async (tx, c) => {
    const existing = await tx.sharedRepayment.findUnique({ where: { id: data.id } });
    if (existing) {
      if (
        existing.eventId === c.event.id &&
        existing.createdById === userId &&
        !existing.cancelledAt &&
        existing.fromId === data.fromId &&
        existing.toId === data.toId &&
        existing.amountCents === data.amountCents
      )
        return;
      throw new SharedBudgetError("Ce remboursement a déjà été enregistré.", 409);
    }
    const allIds = new Set(c.participants.map((p) => p.id));
    if (!allIds.has(data.fromId) || !allIds.has(data.toId) || !canRepay(c, data)) {
      throw new SharedBudgetError(
        "Vous ne pouvez enregistrer que les remboursements qui vous concernent.",
        403,
      );
    }
    const current = await rows(tx, c.event.id);
    const balances = calculateBalances(current.expenses, current.repayments);
    const maxAmount = Math.min(-(balances.get(data.fromId) ?? 0), balances.get(data.toId) ?? 0);
    if (data.amountCents > maxAmount)
      throw new SharedBudgetError("Les soldes ont changé. Vérifiez le remboursement proposé.", 409);
    await tx.sharedRepayment.create({
      data: { ...data, eventId: c.event.id, createdById: userId, createdByName: c.actorName },
    });
  });
}

export async function cancelRepayment(slug: string, userId: string, id: string) {
  return run(slug, userId, async (tx, c) => {
    const payment = await tx.sharedRepayment.findFirst({ where: { id, eventId: c.event.id } });
    if (!payment || !canRepay(c, payment))
      throw new SharedBudgetError("Remboursement introuvable ou modification non autorisée.", 403);
    if (!payment.cancelledAt)
      await tx.sharedRepayment.update({ where: { id }, data: { cancelledAt: new Date() } });
  });
}
