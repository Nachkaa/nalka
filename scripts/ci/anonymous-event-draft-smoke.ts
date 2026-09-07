import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { EventMemberRole, PrismaClient } from "@prisma/client";

import {
  createEventDraft,
  hashEventDraftToken,
} from "@/features/events/server/event-draft";

const prisma = new PrismaClient();
const baseUrl = (process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const ownerEmail = `ci-draft-owner-${suffix}@nalka.local`;
const ownerSessionToken = `ci-draft-session-${randomUUID()}`;

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
  formData.set("description", "Created before authentication by the release gate.");
  formData.set("schedule.mode", "TBD");
  formData.set("schedule.time", "");
  formData.set("location.mode", "TBD");
  formData.set("modules.secretSantaEnabled", "");
  formData.set("modules.bringEnabled", "");
  formData.set("modules.timelineEnabled", "");
  formData.set("modules.budgetEnabled", "");
  formData.set("rules.isNoSpoil", "on");
  formData.set("rules.isAnonReservations", "on");
  formData.set("rules.isSecondHandOk", "");
  formData.set("rules.isHandmadeOk", "");
  formData.set("rules.budgetCap", "");
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
        memberships: {
          where: { userId: owner.id },
          select: { role: true },
        },
      },
    });
    claimedEventId = claimedEvent.id;

    assert.equal(claimedEvent.ownerId, owner.id, "Verified user must own the claimed event");
    assert.equal(claimedEvent.memberships[0]?.role, EventMemberRole.OWNER);

    const claimedDraft = await prisma.eventDraft.findUniqueOrThrow({
      where: { tokenHash: draftTokenHash },
      select: { claimedEventId: true },
    });
    assert.equal(claimedDraft.claimedEventId, claimedEvent.id, "Draft must record its claimed event");

    const repeatedClaim = redirectLocation(await get(claimPath, ownerSessionToken));
    assert.equal(
      repeatedClaim.pathname,
      authenticatedClaim.pathname,
      "Repeated claim by the same verified owner must be idempotent",
    );

    console.log(
      "Anonymous event draft smoke passed: public wizard, auth handoff, verified ownership, idempotent claim.",
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
