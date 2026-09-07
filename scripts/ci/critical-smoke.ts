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
const title = `CI smoke ${suffix}`;
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

async function seed() {
  const owner = await prisma.user.create({
    data: { email: ownerEmail, name: "CI Owner", emailVerified: new Date() },
  });
  const joiner = await prisma.user.create({
    data: { email: joinerEmail, name: "CI Joiner", emailVerified: new Date() },
  });

  const event = await prisma.event.create({
    data: {
      ownerId: owner.id,
      title,
      slug,
      memberships: {
        create: { userId: owner.id, role: EventMemberRole.OWNER },
      },
    },
  });

  const moduleSeeds = buildEventModuleSeeds({
    [EventModuleKey.TIMELINE]: true,
    [EventModuleKey.BUDGET]: true,
    [EventModuleKey.GIFTS]: true,
  });

  await prisma.eventModule.createMany({
    data: moduleSeeds.map((module) => ({ ...module, eventId: event.id })),
  });

  const modules = await prisma.eventModule.findMany({
    where: { eventId: event.id },
    select: { id: true, key: true, enabled: true },
  });
  const moduleByKey = new Map(modules.map((module) => [module.key, module]));
  const moduleId = (key: EventModuleKey) => {
    const module = moduleByKey.get(key);
    assert.ok(module, `Missing seeded module ${key}`);
    return module.id;
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

  const [vendorA, vendorB] = await Promise.all([
    prisma.vendor.create({ data: { eventId: event.id, name: `CI Vendor A ${suffix}` } }),
    prisma.vendor.create({ data: { eventId: event.id, name: `CI Vendor B ${suffix}` } }),
  ]);

  const [quoteA, quoteB] = await Promise.all([
    prisma.quote.create({
      data: {
        budgetLineId: budgetLine.id,
        vendorId: vendorA.id,
        status: QuoteStatus.RECEIVED,
        amount: "1200.00",
        receivedAt: new Date(),
      },
    }),
    prisma.quote.create({
      data: {
        budgetLineId: budgetLine.id,
        vendorId: vendorB.id,
        status: QuoteStatus.RECEIVED,
        amount: "1350.00",
        receivedAt: new Date(),
      },
    }),
  ]);

  const giftList = await prisma.giftList.create({
    data: {
      eventId: event.id,
      ownerId: owner.id,
      title: "CI Owner list",
    },
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

  return { owner, joiner, event, budgetLine, quoteA, quoteB };
}

async function cleanup() {
  await prisma.event.deleteMany({ where: { slug } });
  await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, joinerEmail] } } });
}

async function smokeEventCreationAndModuleLifecycle(eventId: string) {
  const createdModules = await prisma.eventModule.findMany({
    where: { eventId },
    select: { key: true, enabled: true },
  });
  assert.equal(
    createdModules.length,
    buildEventModuleSeeds().length,
    "Event creation smoke must seed the complete module registry",
  );

  const createdEvent = await get(`/event/${slug}`, ownerSessionToken);
  assert.equal(createdEvent.status, 200, "Newly created event must render");

  const enabledTimeline = await get(`/event/${slug}/timeline`, ownerSessionToken);
  assert.equal(enabledTimeline.status, 200, "Enabled module route must render");

  await prisma.eventModule.update({
    where: { eventId_key: { eventId, key: EventModuleKey.TIMELINE } },
    data: { enabled: false },
  });

  const disabledTimeline = await get(`/event/${slug}/timeline`, ownerSessionToken);
  assertRedirect(disabledTimeline, `/event/${slug}`);

  await prisma.eventModule.update({
    where: { eventId_key: { eventId, key: EventModuleKey.TIMELINE } },
    data: { enabled: true },
  });

  const reenabledTimeline = await get(`/event/${slug}/timeline`, ownerSessionToken);
  assert.equal(reenabledTimeline.status, 200, "Re-enabled module route must render again");
}

async function smokeQuoteWorkflow(args: {
  budgetLineId: string;
  quoteId: string;
  alternateQuoteId: string;
}) {
  const select = buildSelectQuoteTransaction({
    budgetLineId: args.budgetLineId,
    quoteId: args.quoteId,
    decisionNote: "CI selected",
  });

  await prisma.$transaction(async (tx) => {
    await tx.quote.updateMany({
      where: select.demoteSelectedWhere,
      data: select.demoteSelectedData,
    });
    await tx.quote.update({
      where: select.selectQuoteWhere,
      data: select.selectQuoteData,
    });
    await tx.budgetLine.update({
      where: select.updateLineWhere,
      data: select.updateLineData,
    });
  });

  const selected = await prisma.budgetLine.findUniqueOrThrow({
    where: { id: args.budgetLineId },
    select: {
      selectedQuoteId: true,
      sourcingStatus: true,
      quotes: { select: { id: true, status: true } },
    },
  });
  assert.equal(selected.selectedQuoteId, args.quoteId, "Quote selection must persist on the line");
  assert.equal(selected.sourcingStatus, BudgetLineSourcingStatus.SELECTED);
  assert.equal(
    selected.quotes.find((quote) => quote.id === args.quoteId)?.status,
    QuoteStatus.SELECTED,
  );
  assert.equal(
    selected.quotes.find((quote) => quote.id === args.alternateQuoteId)?.status,
    QuoteStatus.RECEIVED,
  );

  const quotePage = await get(
    `/event/${slug}/budget/quotes/${args.budgetLineId}`,
    ownerSessionToken,
  );
  assert.equal(quotePage.status, 200, "Quote comparison route must render after selection");

  const reopen = buildReopenSelectedLineTransaction({
    budgetLineId: args.budgetLineId,
    selectedQuoteId: args.quoteId,
    decisionNote: "CI reopened",
    receivedQuotesCount: 2,
    awaitingResponseQuotesCount: 0,
  });

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: reopen.reopenQuoteWhere,
      data: reopen.reopenQuoteData,
    });
    await tx.budgetLine.update({
      where: reopen.updateLineWhere,
      data: reopen.updateLineData,
    });
  });

  const reopened = await prisma.budgetLine.findUniqueOrThrow({
    where: { id: args.budgetLineId },
    select: { selectedQuoteId: true, sourcingStatus: true },
  });
  assert.equal(reopened.selectedQuoteId, null, "Reopening must clear the selected quote");
  assert.equal(reopened.sourcingStatus, BudgetLineSourcingStatus.QUOTES_RECEIVED);
}

async function smokePaymentReversal(args: {
  ownerId: string;
  budgetLineId: string;
  quoteId: string;
}) {
  await prisma.quote.update({
    where: { id: args.quoteId },
    data: { status: QuoteStatus.SELECTED },
  });
  await prisma.budgetLine.update({
    where: { id: args.budgetLineId },
    data: {
      selectedQuoteId: args.quoteId,
      sourcingStatus: BudgetLineSourcingStatus.BOOKED,
    },
  });

  const paidAt = new Date();
  const payment = await prisma.paymentEntry.create({
    data: {
      budgetLineId: args.budgetLineId,
      quoteId: args.quoteId,
      label: "CI deposit",
      entryType: PaymentEntryType.DEPOSIT,
      amount: "300.00",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      paidAt,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.paymentEntry.update({
      where: { id: payment.id },
      data: { paidAt: null },
    });
    await tx.paymentLog.create({
      data: {
        paymentEntryId: payment.id,
        userId: args.ownerId,
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

  const budgetPage = await get(`/event/${slug}/budget`, ownerSessionToken);
  assert.equal(budgetPage.status, 200, "Budget route must render after payment reversal");
}

async function smokeGiftSecrecy(args: {
  ownerId: string;
  joinerId: string;
  eventId: string;
}) {
  const ownerResult = await getEventGiftsScreenData({
    eventId: args.eventId,
    slug,
    currentUserId: args.ownerId,
    eventOwnerId: args.ownerId,
    giftMode: EventGiftMode.HOST_LIST,
    isConfigured: true,
    isNoSpoil: true,
    isAnonReservations: true,
    isAdmin: true,
    giftsModuleEnabled: true,
    includeScreenData: true,
  });

  const ownerItem = ownerResult.screenData?.myList?.items.find((item) => item.title === giftTitle);
  assert.ok(ownerItem, "Owner gift must be present in the gifts screen data");
  assert.equal(ownerItem.reservation.hideReservationState, true);
  assert.equal(ownerItem.reservation.isReserved, false, "Gift owner must not see reservation state");
  assert.equal(ownerItem.reservation.isReservedByCurrentUser, false);
  assert.equal(ownerItem.reservation.reservedByName, null);
  assert.deepEqual(ownerItem.reservation.reservedByNames, []);

  const joinerResult = await getEventGiftsScreenData({
    eventId: args.eventId,
    slug,
    currentUserId: args.joinerId,
    eventOwnerId: args.ownerId,
    giftMode: EventGiftMode.HOST_LIST,
    isConfigured: true,
    isNoSpoil: true,
    isAnonReservations: true,
    isAdmin: false,
    giftsModuleEnabled: true,
    includeScreenData: true,
  });

  const participantItem = joinerResult.screenData?.otherLists
    .flatMap((list) => list.items)
    .find((item) => item.title === giftTitle);
  assert.ok(participantItem, "Participant must see the host gift list");
  assert.equal(participantItem.reservation.isReserved, true);
  assert.equal(participantItem.reservation.reservedByName, null, "Anonymous reservations must hide identity");
  assert.deepEqual(participantItem.reservation.reservedByNames, []);

  const ownerGiftPage = await get(`/event/${slug}/gifts`, ownerSessionToken);
  assert.equal(ownerGiftPage.status, 200, "Gift module must render for the owner");
  const joinerGiftPage = await get(`/event/${slug}/gifts`, joinerSessionToken);
  assert.equal(joinerGiftPage.status, 200, "Gift module must render for a joined participant");
}

async function main() {
  const { owner, joiner, event, budgetLine, quoteA, quoteB } = await seed();

  try {
    const login = await get("/login");
    assert.equal(login.status, 200, "Login page must render");

    const guestEvents = await get("/event");
    assertRedirect(guestEvents, "/login");

    const ownerEvents = await get("/event", ownerSessionToken);
    assert.equal(ownerEvents.status, 200, "Authenticated event list must render");

    await smokeEventCreationAndModuleLifecycle(event.id);

    const join = await get(`/join?code=${encodeURIComponent(inviteCode)}`, joinerSessionToken);
    assertRedirect(join, `/event/${slug}`);

    const membership = await prisma.eventMember.findUnique({
      where: { userId_eventId: { userId: joiner.id, eventId: event.id } },
      select: { role: true },
    });
    assert.equal(membership?.role, EventMemberRole.MEMBER, "Invite must create membership");

    const invite = await prisma.inviteToken.findUnique({
      where: { code: inviteCode },
      select: { remainingUses: true },
    });
    assert.equal(invite?.remainingUses, 0, "Invite must be consumed once");

    const joinedEvent = await get(`/event/${slug}`, joinerSessionToken);
    assert.equal(joinedEvent.status, 200, "Joined member must access the event");

    await smokeQuoteWorkflow({
      budgetLineId: budgetLine.id,
      quoteId: quoteA.id,
      alternateQuoteId: quoteB.id,
    });
    await smokePaymentReversal({
      ownerId: owner.id,
      budgetLineId: budgetLine.id,
      quoteId: quoteA.id,
    });
    await smokeGiftSecrecy({ ownerId: owner.id, joinerId: joiner.id, eventId: event.id });

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
