import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { EventMemberRole, PrismaClient } from "@prisma/client";

import { createEventDraft, hashEventDraftToken } from "@/features/events/server/event-draft";

const prisma = new PrismaClient();
const baseUrl = (process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const ownerEmail = `ci-draft-owner-${suffix}@nalka.local`;
const ownerSessionToken = `ci-draft-session-${randomUUID()}`;
const draftDescription = "Une semaine au ski entre amis, avec du fromage et des jeux. ".repeat(12);
const pollDates = ["2099-01-09", "2099-01-16", "2099-01-23", "2099-01-30", "2099-02-06"];
const pollLocations = ["🏔️ Serre Chevalier", "🎿 Tignes", "💡 Autre station"];

let draftTokenHash: string | null = null;
let claimedEventId: string | null = null;

function sessionCookie(token: string) {
  return `next-auth.session-token=${encodeURIComponent(token)}`;
}

async function get(path: string, sessionToken?: string) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: sessionToken ? { cookie: sessionCookie(sessionToken) } : undefined,
  });
}

function redirectLocation(response: Response) {
  assert.ok(
    response.status === 307 || response.status === 308,
    `Expected redirect for ${response.url}, received ${response.status}`,
  );

  const location = response.headers.get("location");
  assert.ok(location, `Missing redirect location for ${response.url}`);
  return new URL(location, baseUrl);
}

function buildDraftFormData() {
  const formData = new FormData();
  formData.set("title", `CI anonymous draft ${suffix}`);
  formData.set("description", draftDescription);
  formData.set("schedule.mode", "POLL");
  for (const date of pollDates) formData.append("schedule.options", date);
  formData.set("schedule.time", "");
  formData.set("location.mode", "POLL");
  for (const location of pollLocations) formData.append("location.options", location);
  formData.set("modules.secretSantaEnabled", "on");
  formData.set("modules.giftsEnabled", "on");
  formData.set("giftMode", "PERSONAL_LISTS");
  formData.set("modules.bringEnabled", "");
  formData.set("modules.timelineEnabled", "");
  formData.set("modules.budgetEnabled", "");
  formData.set("rules.isNoSpoil", "on");
  formData.set("rules.isAnonReservations", "on");
  formData.set("rules.isSecondHandOk", "");
  formData.set("rules.isHandmadeOk", "");
  formData.set("rules.budgetCap", "");
  formData.set("access.restrictEmailDomains", "on");
  formData.append("access.allowedEmailDomains", "@NALKA.LOCAL");
  return formData;
}

async function cleanup() {
  if (draftTokenHash) {
    await prisma.eventDraft.deleteMany({ where: { tokenHash: draftTokenHash } });
  }
  if (claimedEventId) {
    await prisma.event.deleteMany({ where: { id: claimedEventId } });
  }
  await prisma.user.deleteMany({ where: { email: ownerEmail } });
}

async function main() {
  const owner = await prisma.user.create({
    data: { email: ownerEmail, name: "CI Draft Owner", emailVerified: new Date() },
  });
  await prisma.session.create({
    data: {
      userId: owner.id,
      sessionToken: ownerSessionToken,
      expires: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  try {
    assert.equal((await get("/event/new")).status, 200, "Anonymous event wizard must render");

    const token = await createEventDraft(buildDraftFormData());
    draftTokenHash = hashEventDraftToken(token);
    const claimPath = `/event/new/claim?draft=${encodeURIComponent(token)}`;

    const anonymousClaim = redirectLocation(await get(claimPath));
    assert.equal(anonymousClaim.pathname, "/login", "Anonymous claim must require authentication");
    assert.equal(anonymousClaim.searchParams.get("from"), claimPath);
    assert.equal(anonymousClaim.searchParams.get("intent"), "create-event");

    const authenticatedClaim = redirectLocation(await get(claimPath, ownerSessionToken));
    assert.match(authenticatedClaim.pathname, /^\/event\/[^/]+$/);

    const eventSlug = authenticatedClaim.pathname.slice("/event/".length);
    const claimedEvent = await prisma.event.findUniqueOrThrow({
      where: { slug: eventSlug },
      select: {
        id: true,
        ownerId: true,
        description: true,
        scheduleMode: true,
        locationMode: true,
        polls: {
          select: {
            type: true,
            options: {
              orderBy: { sort: "asc" },
              select: { dateValue: true, textValue: true },
            },
          },
        },
        allowedEmailDomains: true,
        giftMode: true,
        modules: { select: { key: true, enabled: true } },
        memberships: {
          where: { userId: owner.id },
          select: { role: true },
        },
      },
    });
    claimedEventId = claimedEvent.id;

    assert.equal(claimedEvent.ownerId, owner.id, "Verified user must own the claimed event");
    assert.equal(claimedEvent.description, draftDescription);
    assert.equal(claimedEvent.scheduleMode, "POLL");
    assert.equal(claimedEvent.locationMode, "POLL");
    assert.deepEqual(
      claimedEvent.polls
        .find((poll) => poll.type === "SCHEDULE")
        ?.options.map((option) => option.dateValue?.toISOString().slice(0, 10)),
      pollDates,
      "All date choices must survive event creation",
    );
    assert.deepEqual(
      claimedEvent.polls
        .find((poll) => poll.type === "LOCATION")
        ?.options.map((option) => option.textValue),
      pollLocations,
      "All destination choices, including emoji, must survive event creation",
    );
    assert.equal(claimedEvent.memberships[0]?.role, EventMemberRole.OWNER);
    assert.equal(claimedEvent.giftMode, "PERSONAL_LISTS");
    assert.ok(
      claimedEvent.modules.some((module) => module.key === "SECRET_SANTA" && module.enabled),
    );
    assert.ok(claimedEvent.modules.some((module) => module.key === "GIFTS" && module.enabled));
    assert.deepEqual(
      claimedEvent.allowedEmailDomains,
      ["nalka.local"],
      "Anonymous drafts must preserve the normalized access policy",
    );

    const claimedDraft = await prisma.eventDraft.findUniqueOrThrow({
      where: { tokenHash: draftTokenHash },
      select: { claimedEventId: true },
    });
    assert.equal(
      claimedDraft.claimedEventId,
      claimedEvent.id,
      "Draft must record its claimed event",
    );

    const repeatedClaim = redirectLocation(await get(claimPath, ownerSessionToken));
    assert.equal(
      repeatedClaim.pathname,
      authenticatedClaim.pathname,
      "Repeated claim by the same verified owner must be idempotent",
    );

    console.log(
      "Anonymous event draft smoke passed: public wizard, long description, date and destination polls, auth handoff, verified ownership, idempotent claim.",
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
