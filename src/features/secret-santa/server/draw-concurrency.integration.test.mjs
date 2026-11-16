import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { PrismaClient } from "@prisma/client";

import { deferred, drawForm, isolatedModule, loadDrawAction } from "./draw-test-fixture.mjs";

// This suite creates/deletes controlled fixtures and must never target production.
if (
  process.env.NALKA_TEST_DATABASE !== "1" ||
  new URL(process.env.DATABASE_URL).pathname !== "/nalka_ci" ||
  process.env.DIRECT_URL
) {
  throw new Error("Enable this suite only against the dedicated nalka_ci fixture database.");
}
const prisma = new PrismaClient();
after(() => prisma.$disconnect());

async function fixture(existing) {
  const suffix = randomUUID();
  const users = await Promise.all(
    [0, 1, 2].map((index) =>
      prisma.user.create({
        data: {
          name: `Fixture ${index}`,
          email: `ss-${suffix}-${index}@example.test`,
          emailVerified: new Date(),
        },
      }),
    ),
  );
  const event = await prisma.event.create({
    data: {
      title: "CI concurrent Santa",
      slug: `ss-concurrent-${suffix}`,
      ownerId: users[0].id,
      memberships: {
        create: users.map((user, index) => ({ userId: user.id, role: index ? "MEMBER" : "OWNER" })),
      },
      modules: { create: { key: "SECRET_SANTA", enabled: true, position: 0 } },
    },
    include: { modules: true },
  });
  if (existing)
    await prisma.secretSantaAssignment.createMany({
      data: users.map((user, index) => ({
        eventId: event.id,
        giverId: user.id,
        receiverId: users[(index + 1) % users.length].id,
      })),
    });
  const messages = [];
  const started = deferred();
  const finish = deferred();
  const createAction = () =>
    loadDrawAction({
      prisma,
      access: async () => ({ event, eventModule: event.modules[0] }),
      mail: async (message) => {
        messages.push(message);
        started.resolve();
        await finish.promise;
      },
    });
  return {
    event,
    users,
    messages,
    started,
    finish,
    createAction,
    assignments: () =>
      prisma.secretSantaAssignment.findMany({
        where: { eventId: event.id },
        orderBy: { giverId: "asc" },
      }),
    cleanup: async () => {
      await prisma.secretSantaAssignment.deleteMany({ where: { eventId: event.id } });
      await prisma.event.delete({ where: { id: event.id } });
      await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
    },
  };
}

for (const existing of [false, true]) {
  test(
    `PostgreSQL prevents competing ${existing ? "redraws" : "first draws"} and delayed duplicates`,
    { timeout: 30_000 },
    async () => {
      const f = await fixture(existing);
      const a = f.createAction();
      const b = f.createAction();
      const revision = await a.readDrawRevision(f.event.id);
      const form = drawForm(f.event.id, revision, existing);
      const first = a.launchDraw(form);
      try {
        // A has committed its assignments, but is still publishing notifications.
        await Promise.race([
          f.started.promise,
          first.then(() => {
            throw new Error("Draw did not reach notifications");
          }),
        ]);
        const saved = await f.assignments();
        assert.equal(saved.length, f.users.length);
        assert.equal((await b.launchDraw(form)).status, "busy");
        assert.deepEqual(await f.assignments(), saved);
        f.finish.resolve();
        const result = await first;
        assert.equal(result.status, "completed");
        assert.equal((await b.launchDraw(form)).status, "stale");
        assert.deepEqual(await f.assignments(), saved);
        assert.equal(f.messages.length, f.users.length);
        for (const message of f.messages) {
          const giver = f.users.find((user) => user.email === message.to);
          const assignment = saved.find((row) => row.giverId === giver.id);
          const receiver = f.users.find((user) => user.id === assignment.receiverId);
          assert.equal(JSON.parse(message.html).receiverName, receiver.name);
          assert.notEqual(assignment.giverId, assignment.receiverId);
        }
        const next = await b.launchDraw(drawForm(f.event.id, result.drawRevision, true));
        assert.equal(next.status, "completed");
        assert.notEqual(next.drawRevision, result.drawRevision);
      } finally {
        f.finish.resolve();
        await first.catch(() => {});
        await f.cleanup();
      }
    },
  );
}

test(
  "PostgreSQL session locks are event-specific and released after exceptions",
  { timeout: 15_000 },
  async () => {
    const { withDrawLock } = isolatedModule("./draw-lock.ts");
    const id = randomUUID();
    await withDrawLock(id, async () => {
      assert.equal(await withDrawLock(id, async () => assert.fail("Competing session ran")), null);
      assert.equal(await withDrawLock(`${id}-other`, async () => "independent"), "independent");
    });
    await assert.rejects(
      withDrawLock(id, async () => {
        throw new Error("Fixture failure");
      }),
      /Fixture failure/,
    );
    assert.equal(await withDrawLock(id, async () => "released"), "released");
  },
);
