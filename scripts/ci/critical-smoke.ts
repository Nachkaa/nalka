import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  BudgetLineCategory,
  BudgetLineSourcingStatus,
  BudgetSetupStatus,
  EventGiftMode,
  EventMemberRole,
  EventModuleKey,
  PaymentEntryType,
  PaymentLogAction,
  PrismaClient,
  QuoteStatus,
  ReservationStatus,
} from "@prisma/client";

import {
  buildReopenSelectedLineTransaction,
  buildSelectQuoteTransaction,
} from "@/features/budget/server/workflow";
import { buildEventModuleSeeds } from "@/features/events/module-registry";
import { getEventGiftsScreenData } from "@/features/gifts/server/queries/get-event-gifts-screen-data";

const prisma = new PrismaClient();
const baseUrl = (process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const slug = `ci-smoke-${suffix}`;
const ownerEmail = `ci-owner-${suffix}@nalka.local`;
const joinerEmail = `ci-joiner-${suffix}@nalka.local`;
const ownerSessionToken = `ci-owner-session-${randomUUID()}`;
const joinerSessionToken = `ci-joiner-session-${randomUUID()}`;
const inviteCode = `ci-invite-${randomUUID()}`;
const giftTitle = `CI secret gift ${suffix}`;

function sessionCookie(token: string) {
  return `next-auth.session-token=${encodeURIComponent(token)}`;
}

async function get(path: string, sessionToken?: string) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: sessionToken ? { cookie: sessionCookie(sessionToken) } : undefined,
  });
}

function assertRedirect(response: Response, pathname: string) {
  assert.ok(
    response.status === 307 || response.status === 308,
    `Expected redirect for ${response.url}, received ${response.status}`,
  );
  const location = response.headers.get("location");
  assert.ok(location, `Missing redirect location for ${response.url}`);
  assert.equal(new URL(location, baseUrl).pathname, pathname);
}

async function seedCriticalEvent() {
  const owner = await prisma.user.create({
    data: { email: ownerEmail, name: "CI Owner", emailVerified: new Date() },
  });
  const joiner = await prisma.user.create({
    data: { email: joinerEmail, name: "CI Joiner", emailVerified: new Date() },
  });

  const event = await prisma.event.create({
    data: {
      ownerId: owner.id,
      title: `CI smoke ${suffix}`,
      slug,
      memberships: { create: { userId: owner.id, role: EventMemberRole.OWNER } },
    },
  });

  const moduleSeeds = buildEventModuleSeeds({
    [EventModuleKey.TIMELINE]: true,
    [EventModuleKey.BUDGET]: true,
    [EventModuleKey.GIFTS]: true,
  });
  await prisma.eventModule.createMany({
    data: moduleSeeds.map((eventModule) => ({ ...eventModule, eventId: event.id })),
  });

  const eventModules = await prisma.eventModule.findMany({
    where: { eventId: event.id },
    select: { id: true, key: true },
  });
  const moduleByKey = new Map(eventModules.map((eventModule) => [eventModule.key, eventModule]));
  const moduleId = (key: EventModuleKey) => {
    const eventModule = moduleByKey.get(key);
    assert.ok(eventModule, `Missing seeded module ${key}`);
    return eventModule.id;
  };

  await prisma.$transaction([
    prisma.eventOverviewSettings.create({
      data: { eventModuleId: moduleId(EventModuleKey.OVERVIEW), rsvpRequired: true },
    }),
    prisma.eventTimelineSettings.create({
      data: { eventModuleId: moduleId(EventModuleKey.TIMELINE) },
    }),
    prisma.eventExpensesSettings.create({
      data: { eventModuleId: moduleId(EventModuleKey.BUDGET) },
    }),
    prisma.eventGiftsSettings.create({
      data: {
        eventModuleId: moduleId(EventModuleKey.GIFTS),
        isNoSpoil: true,
        isAnonReservations: true,
      },
    }),
  ]);

  const budget = await prisma.budget.create({
    data: {
      eventId: event.id,
      totalBudget: "5000.00",
      setupStatus: BudgetSetupStatus.STARTED,
    },
  });
  const budgetLine = await prisma.budgetLine.create({
    data: {
      budgetId: budget.id,
      category: BudgetLineCategory.VENUE,
      label: `CI venue ${suffix}`,
      targetAmount: "1500.00",
      sourcingStatus: BudgetLineSourcingStatus.QUOTES_RECEIVED,
    },
  });

  const vendorA = await prisma.vendor.create({
    data: { eventId: event.id, name: `CI Vendor A ${suffix}` },
  });
  const vendorB = await prisma.vendor.create({
    data: { eventId: event.id, name: `CI Vendor B ${suffix}` },
  });
  const quoteA = await prisma.quote.create({
    data: {
      budgetLineId: budgetLine.id,
      vendorId: vendorA.id,
      status: QuoteStatus.RECEIVED,
      amount: "1200.00",
      receivedAt: new Date(),
    },
  });
  const quoteB = await prisma.quote.create({
    data: {
      budgetLineId: budgetLine.id,
      vendorId: vendorB.id,
      status: QuoteStatus.RECEIVED,
      amount: "1350.00",
      receivedAt: new Date(),
    },
  });

  const giftList = await prisma.giftList.create({
    data: { eventId: event.id, ownerId: owner.id, title: "CI Owner list" },
  });
  const giftItem = await prisma.giftItem.create({
    data: { listId: giftList.id, title: giftTitle },
  });
  await prisma.reservation.create({
    data: {
      itemId: giftItem.id,
      byUserId: joiner.id,
      status: ReservationStatus.RESERVED,
      anonymous: false,
    },
  });

  const expires = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.session.createMany({
    data: [
      { userId: owner.id, sessionToken: ownerSessionToken, expires },
      { userId: joiner.id, sessionToken: joinerSessionToken, expires },
    ],
  });
  await prisma.inviteToken.create({
    data: {
      eventId: event.id,
      code: inviteCode,
      remainingUses: 1,
      createdById: owner.id,
      expiresAt: expires,
    },
  });

  return { owner, joiner, event, budgetLine, quoteA, quoteB, moduleSeeds };
}

async function cleanup() {
  await prisma.event.deleteMany({ where: { slug } });
  await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, joinerEmail] } } });
}

async function smokeAuthAndEventCreation(eventId: string, expectedModuleCount: number) {
  assert.equal((await get("/login")).status, 200, "Login page must render");
  assertRedirect(await get("/event"), "/login");
  assert.equal((await get("/event", ownerSessionToken)).status, 200, "Event list must render");
  assert.equal((await get("/event/new", ownerSessionToken)).status, 200, "Event creation UI must render");
  assert.equal((await get(`/event/${slug}`, ownerSessionToken)).status, 200, "Created event must render");

  const moduleCount = await prisma.eventModule.count({ where: { eventId } });
  assert.equal(moduleCount, expectedModuleCount, "Created event must seed the complete module registry");
}

async function smokeInviteJoin(joinerId: string, eventId: string) {
  const join = await get(`/join?code=${encodeURIComponent(inviteCode)}`, joinerSessionToken);
  assertRedirect(join, `/event/${slug}`);

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: joinerId, eventId } },
    select: { role: true },
  });
  assert.equal(membership?.role, EventMemberRole.MEMBER, "Invite must create membership");

  const invite = await prisma.inviteToken.findUnique({
    where: { code: inviteCode },
    select: { remainingUses: true },
  });
  assert.equal(invite?.remainingUses, 0, "Invite must be consumed once");
  assert.equal((await get(`/event/${slug}`, joinerSessionToken)).status, 200);
}

async function smokeModuleLifecycle(eventId: string) {
  assert.equal((await get(`/event/${slug}/timeline`, ownerSessionToken)).status, 200);

  await prisma.eventModule.update({
    where: { eventId_key: { eventId, key: EventModuleKey.TIMELINE } },
    data: { enabled: false },
  });
  assertRedirect(await get(`/event/${slug}/timeline`, ownerSessionToken), `/event/${slug}`);

  await prisma.eventModule.update({
    where: { eventId_key: { eventId, key: EventModuleKey.TIMELINE } },
    data: { enabled: true },
  });
  assert.equal((await get(`/event/${slug}/timeline`, ownerSessionToken)).status, 200);
}

async function smokeQuoteWorkflow(budgetLineId: string, quoteId: string, alternateQuoteId: string) {
  const select = buildSelectQuoteTransaction({
    budgetLineId,
    quoteId,
    decisionNote: "CI selected",
  });
  await prisma.$transaction(async (tx) => {
    await tx.quote.updateMany({ where: select.demoteSelectedWhere, data: select.demoteSelectedData });
    await tx.quote.update({ where: select.selectQuoteWhere, data: select.selectQuoteData });
    await tx.budgetLine.update({ where: select.updateLineWhere, data: select.updateLineData });
  });

  const selected = await prisma.budgetLine.findUniqueOrThrow({
    where: { id: budgetLineId },
    select: { selectedQuoteId: true, sourcingStatus: true, quotes: { select: { id: true, status: true } } },
  });
  assert.equal(selected.selectedQuoteId, quoteId);
  assert.equal(selected.sourcingStatus, BudgetLineSourcingStatus.SELECTED);
  assert.equal(selected.quotes.find((quote) => quote.id === quoteId)?.status, QuoteStatus.SELECTED);
  assert.equal(
    selected.quotes.find((quote) => quote.id === alternateQuoteId)?.status,
    QuoteStatus.RECEIVED,
  );
  assert.equal(
    (await get(`/event/${slug}/budget/quotes/${budgetLineId}`, ownerSessionToken)).status,
    200,
    "Quote comparison route must render",
  );

  const reopen = buildReopenSelectedLineTransaction({
    budgetLineId,
    selectedQuoteId: quoteId,
    decisionNote: "CI reopened",
    receivedQuotesCount: 2,
    awaitingResponseQuotesCount: 0,
  });
  await prisma.$transaction(async (tx) => {
    await tx.quote.update({ where: reopen.reopenQuoteWhere, data: reopen.reopenQuoteData });
    await tx.budgetLine.update({ where: reopen.updateLineWhere, data: reopen.updateLineData });
  });

  const reopened = await prisma.budgetLine.findUniqueOrThrow({
    where: { id: budgetLineId },
    select: { selectedQuoteId: true, sourcingStatus: true },
  });
  assert.equal(reopened.selectedQuoteId, null, "Reopen must clear selected quote");
  assert.equal(reopened.sourcingStatus, BudgetLineSourcingStatus.QUOTES_RECEIVED);
}

async function smokePaymentReversal(ownerId: string, budgetLineId: string, quoteId: string) {
  await prisma.quote.update({ where: { id: quoteId }, data: { status: QuoteStatus.SELECTED } });
  await prisma.budgetLine.update({
    where: { id: budgetLineId },
    data: { selectedQuoteId: quoteId, sourcingStatus: BudgetLineSourcingStatus.BOOKED },
  });

  const paidAt = new Date();
  const payment = await prisma.paymentEntry.create({
    data: {
      budgetLineId,
      quoteId,
      label: "CI deposit",
      entryType: PaymentEntryType.DEPOSIT,
      amount: "300.00",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      paidAt,
    },
  });
  await prisma.$transaction(async (tx) => {
    await tx.paymentEntry.update({ where: { id: payment.id }, data: { paidAt: null } });
    await tx.paymentLog.create({
      data: {
        paymentEntryId: payment.id,
        userId: ownerId,
        action: PaymentLogAction.MARKED_UNPAID,
        previousPaidAt: paidAt,
        newPaidAt: null,
      },
    });
  });

  const reversed = await prisma.paymentEntry.findUniqueOrThrow({
    where: { id: payment.id },
    select: { paidAt: true, logs: { select: { action: true, previousPaidAt: true, newPaidAt: true } } },
  });
  assert.equal(reversed.paidAt, null, "Payment reversal must clear paidAt");
  assert.ok(
    reversed.logs.some(
      (log) =>
        log.action === PaymentLogAction.MARKED_UNPAID &&
        log.previousPaidAt !== null &&
        log.newPaidAt === null,
    ),
    "Payment reversal must be audit logged",
  );
  assert.equal((await get(`/event/${slug}/budget`, ownerSessionToken)).status, 200);
}

async function smokeGiftSecrecy(ownerId: string, joinerId: string, eventId: string) {
  const common = {
    eventId,
    slug,
    eventOwnerId: ownerId,
    giftMode: EventGiftMode.HOST_LIST,
    isConfigured: true,
    isNoSpoil: true,
    isAnonReservations: true,
    giftsModuleEnabled: true,
    includeScreenData: true,
  } as const;

  const ownerResult = await getEventGiftsScreenData({
    ...common,
    currentUserId: ownerId,
    isAdmin: true,
  });
  const ownerItem = ownerResult.screenData?.myList?.items.find((item) => item.title === giftTitle);
  assert.ok(ownerItem, "Gift owner item must exist");
  assert.equal(ownerItem.reservation.hideReservationState, true);
  assert.equal(ownerItem.reservation.isReserved, false, "Gift owner must not see reservation state");
  assert.equal(ownerItem.reservation.reservedByName, null);
  assert.deepEqual(ownerItem.reservation.reservedByNames, []);

  const joinerResult = await getEventGiftsScreenData({
    ...common,
    currentUserId: joinerId,
    isAdmin: false,
  });
  const participantItem = joinerResult.screenData?.otherLists
    .flatMap((list) => list.items)
    .find((item) => item.title === giftTitle);
  assert.ok(participantItem, "Participant must see host gift item");
  assert.equal(participantItem.reservation.isReserved, true);
  assert.equal(participantItem.reservation.reservedByName, null, "Anonymous reservation must hide identity");
  assert.deepEqual(participantItem.reservation.reservedByNames, []);

  assert.equal((await get(`/event/${slug}/gifts`, ownerSessionToken)).status, 200);
  assert.equal((await get(`/event/${slug}/gifts`, joinerSessionToken)).status, 200);
}

async function main() {
  const seeded = await seedCriticalEvent();
  try {
    await smokeAuthAndEventCreation(seeded.event.id, seeded.moduleSeeds.length);
    await smokeInviteJoin(seeded.joiner.id, seeded.event.id);
    await smokeModuleLifecycle(seeded.event.id);
    await smokeQuoteWorkflow(seeded.budgetLine.id, seeded.quoteA.id, seeded.quoteB.id);
    await smokePaymentReversal(seeded.owner.id, seeded.budgetLine.id, seeded.quoteA.id);
    await smokeGiftSecrecy(seeded.owner.id, seeded.joiner.id, seeded.event.id);
    console.log(
      "Critical smoke passed: login, invite join, event creation, module lifecycle, quote workflow, payment reversal, gift secrecy.",
    );
  } finally {
    await cleanup();
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
