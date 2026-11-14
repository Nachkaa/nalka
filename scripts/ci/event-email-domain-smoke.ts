import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { EventGiftMode, EventMemberRole, EventModuleKey, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = (process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const suffix = randomUUID();
const slug = `ci-email-access-${suffix}`;
const code = `ci-email-access-${randomUUID()}`;
const users: Array<{ id: string; session: string }> = [];

async function get(path: string, session?: string) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: session
      ? { cookie: `next-auth.session-token=${encodeURIComponent(session)}` }
      : undefined,
  });
}

async function createUser(domain: string, verified = true) {
  const user = await prisma.user.create({
    data: {
      email: `ci-${randomUUID()}@${domain}`,
      name: "CI domain participant",
      emailVerified: verified ? new Date() : null,
    },
  });
  const session = `ci-domain-session-${randomUUID()}`;
  users.push({ id: user.id, session });
  await prisma.session.create({
    data: { userId: user.id, sessionToken: session, expires: new Date(Date.now() + 30 * 60_000) },
  });
  return { ...user, session };
}

function assertJoined(response: Response) {
  assert.ok(
    response.status === 307 || response.status === 308,
    `Expected admission redirect, got ${response.status}`,
  );
  assert.equal(new URL(response.headers.get("location")!, baseUrl).pathname, `/event/${slug}`);
}

async function main() {
  try {
    const owner = await createUser("external-organizer.test");
    const member = await createUser("departement06.fr");
    const outsider = await createUser("gmail.com");
    const suffixSpoof = await createUser("departement06.fr.evil.test");
    const subdomain = await createUser("sub.departement06.fr");
    const unverified = await createUser("departement06.fr", false);
    const invitedExternal = await createUser("contractor.test");
    const event = await prisma.event.create({
      data: {
        ownerId: owner.id,
        title: "CI restricted event",
        slug,
        allowedEmailDomains: ["departement06.fr"],
        giftMode: EventGiftMode.PERSONAL_LISTS,
        modules: {
          create: [
            {
              key: EventModuleKey.OVERVIEW,
              enabled: true,
              position: 0,
              overviewSettings: { create: {} },
            },
            {
              key: EventModuleKey.GIFTS,
              enabled: true,
              position: 1,
              giftsSettings: { create: {} },
            },
          ],
        },
        memberships: {
          create: [
            { userId: owner.id, role: EventMemberRole.OWNER },
            { userId: invitedExternal.id, role: EventMemberRole.MEMBER },
          ],
        },
      },
    });
    await prisma.inviteToken.create({
      data: { eventId: event.id, code, remainingUses: 5, createdById: owner.id },
    });
    const joinPath = `/join?code=${encodeURIComponent(code)}`;
    const anonymous = await get(joinPath);
    assert.equal(anonymous.status, 200);
    const anonymousHtml = await anonymous.text();
    assert.ok(
      anonymousHtml.includes("@departement06.fr"),
      "Restrictions must be visible before sign-in",
    );
    assert.ok(
      !anonymousHtml.includes(owner.email),
      "Invite preview must not disclose organizer email",
    );

    for (const denied of [outsider, suffixSpoof, subdomain, unverified]) {
      const response = await get(joinPath, denied.session);
      assert.equal(
        response.status,
        200,
        "Ineligible users should see a recoverable admission screen",
      );
      assert.ok((await response.text()).includes("Utiliser une adresse professionnelle"));
      assert.equal(
        await prisma.eventMember.count({ where: { eventId: event.id, userId: denied.id } }),
        0,
      );
      assert.equal(
        await prisma.giftList.count({ where: { eventId: event.id, ownerId: denied.id } }),
        0,
      );
      assert.equal(
        (await prisma.inviteToken.findUniqueOrThrow({ where: { code } })).remainingUses,
        5,
      );
    }

    assertJoined(await get(joinPath, member.session));
    assert.equal(
      await prisma.giftList.count({ where: { eventId: event.id, ownerId: member.id } }),
      1,
      "Eligible admission must create the personal gift list",
    );
    assert.equal(
      (await prisma.inviteToken.findUniqueOrThrow({ where: { code } })).remainingUses,
      4,
    );
    assertJoined(await get(joinPath, member.session));
    assert.equal(
      (await prisma.inviteToken.findUniqueOrThrow({ where: { code } })).remainingUses,
      4,
      "Repeated admission must be idempotent",
    );

    assert.equal((await get(`/event/${slug}/edit`, owner.session)).status, 200);
    assert.equal(
      (await get(`/event/${slug}/edit`, member.session)).status,
      404,
      "Only organizers may see access settings",
    );
    const relativePage = await get(`/event/${slug}/participants/add-relative`, member.session);
    assert.ok((await relativePage.text()).includes("Les participants sans compte ne peuvent pas"));

    await prisma.event.update({
      where: { id: event.id },
      data: { allowedEmailDomains: ["partner.test"] },
    });
    const newWorkUser = await createUser("departement06.fr");
    assert.equal((await get(joinPath, newWorkUser.session)).status, 200);
    assert.equal(
      await prisma.eventMember.count({ where: { eventId: event.id, userId: newWorkUser.id } }),
      0,
      "Old links must enforce the current policy",
    );
    const partner = await createUser("partner.test");
    assertJoined(await get(joinPath, partner.session));

    assertJoined(await get(joinPath, invitedExternal.session));
    assertJoined(await get(joinPath, owner.session));
    assertJoined(await get(joinPath, member.session));
    assert.equal(
      (await prisma.inviteToken.findUniqueOrThrow({ where: { code } })).remainingUses,
      3,
      "Existing members must not consume uses or lose access",
    );

    await prisma.event.update({ where: { id: event.id }, data: { allowedEmailDomains: [] } });
    assertJoined(await get(joinPath, outsider.session));

    console.log(
      "Email-domain smoke passed: verified exact-domain admission, spoof and unverified rejection, no mutation on denial, organizer-only settings, accountless participant guard, current policy, external exceptions, unrestricted fallback.",
    );
  } finally {
    await prisma.event.deleteMany({ where: { slug } });
    await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
