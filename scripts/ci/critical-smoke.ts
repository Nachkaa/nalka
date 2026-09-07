import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { EventMemberRole, EventModuleKey, PrismaClient } from "@prisma/client";

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
      modules: {
        create: {
          key: EventModuleKey.OVERVIEW,
          enabled: true,
          position: 0,
          overviewSettings: { create: { rsvpRequired: true } },
        },
      },
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

  return { owner, joiner, event };
}

async function cleanup() {
  await prisma.event.deleteMany({ where: { slug } });
  await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, joinerEmail] } } });
}

async function main() {
  const { joiner, event } = await seed();

  try {
    const login = await get("/login");
    assert.equal(login.status, 200, "Login page must render");

    const guestEvents = await get("/event");
    assertRedirect(guestEvents, "/login");

    const ownerEvents = await get("/event", ownerSessionToken);
    assert.equal(ownerEvents.status, 200, "Authenticated event list must render");

    const ownerEvent = await get(`/event/${slug}`, ownerSessionToken);
    assert.equal(ownerEvent.status, 200, "Authenticated event detail must render");

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

    console.log("Critical smoke passed: login, auth redirect, event access, invite acceptance.");
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
