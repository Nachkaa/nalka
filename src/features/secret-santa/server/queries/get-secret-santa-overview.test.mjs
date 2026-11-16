import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const load = createRequire(import.meta.url);
const source = ts.transpileModule(
  readFileSync(new URL("./get-secret-santa-overview.ts", import.meta.url), "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText;

function fixture({
  denied = false,
  disabled = false,
  role = "MEMBER",
  assignments = 0,
  mine = 0,
  members = 2,
  recipient = { name: "Camille", email: "camille@example.test" },
} = {}) {
  const calls = [];
  let transactionOptions;
  const mocks = {
    "server-only": {},
    "@prisma/client": {
      EventModuleKey: { SECRET_SANTA: "SECRET_SANTA" },
      Prisma: { TransactionIsolationLevel: { RepeatableRead: "RepeatableRead" } },
    },
    "@/features/events/access": {
      requireEnabledModule: async (input) => {
        assert.deepEqual(input, {
          eventId: "input-event",
          userId: "input-user",
          key: "SECRET_SANTA",
        });
        if (denied) throw new Error("Forbidden");
        if (disabled) throw new Error("Not found");
        return {
          event: { id: "authorized-event" },
          userId: "authorized-user",
          membership: { role },
        };
      },
      isOrganizerRole: (value) => value === "OWNER" || value === "ADMIN",
    },
    "@/lib/prisma": {
      prisma: {
        secretSantaAssignment: {
          count: async (args) => {
            calls.push(args);
            return assignments;
          },
          findUnique: async (args) => {
            calls.push(args);
            return mine ? { receiverId: "my-recipient" } : null;
          },
        },
        eventMember: {
          count: async (args) => {
            calls.push(args);
            return members;
          },
        },
        user: {
          findUnique: async (args) => {
            calls.push(args);
            assert.deepEqual(args, {
              where: { id: "my-recipient" },
              select: { name: true, email: true },
            });
            return recipient;
          },
        },
        $transaction: async (read, options) => {
          transactionOptions = options;
          return read(mocks["@/lib/prisma"].prisma);
        },
      },
    },
  };
  const fixtureModule = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(
    (name) => (name in mocks ? mocks[name] : load(name)),
    fixtureModule,
    fixtureModule.exports,
  );
  return {
    calls,
    options: () => transactionOptions,
    read: () =>
      fixtureModule.exports.getSecretSantaOverview({
        eventId: "input-event",
        userId: "input-user",
        budgetCapCents: 2000,
      }),
  };
}

for (const access of [{ denied: true }, { disabled: true }]) {
  test(`checks membership and enabled module before any summary read: ${JSON.stringify(access)}`, async () => {
    const f = fixture(access);
    await assert.rejects(f.read(), /Forbidden|Not found/);
    assert.deepEqual(f.calls, []);
  });
}

for (const role of ["OWNER", "ADMIN", "MEMBER"]) {
  test(`returns count-only waiting summary with server-derived capability for ${role}`, async () => {
    const f = fixture({ role });
    assert.deepEqual(await f.read(), {
      state: "waiting",
      membersCount: 2,
      canManage: role !== "MEMBER",
      budgetCapCents: 2000,
    });
    assert.deepEqual(f.calls, [
      { where: { eventId: "authorized-event" } },
      {
        where: { eventId_giverId: { eventId: "authorized-event", giverId: "authorized-user" } },
        select: { receiverId: true },
      },
      { where: { eventId: "authorized-event" } },
    ]);
    assert.deepEqual(f.options(), { isolationLevel: "RepeatableRead" });
  });
}

test("assignment available means the current giver has one, never another member's assignment", async () => {
  const f = fixture({ assignments: 8, mine: 1, members: 8 });
  const summary = await f.read();
  assert.equal(summary.state, "assigned");
  assert.equal(summary.recipientLabel, "Camille");
  assert.deepEqual(Object.keys(summary).sort(), [
    "budgetCapCents",
    "canManage",
    "membersCount",
    "recipientLabel",
    "state",
  ]);
});

for (const name of [null, "", "   "]) {
  test(`uses the recipient email when the display name is ${JSON.stringify(name)}`, async () => {
    const summary = await fixture({
      assignments: 2,
      mine: 1,
      recipient: { name, email: "camille@example.test" },
    }).read();
    assert.equal(summary.recipientLabel, "camille@example.test");
  });
}

test("a member joining after the draw is told that they have no assignment", async () => {
  const summary = await fixture({ assignments: 8, mine: 0, members: 9 }).read();
  assert.equal(summary.state, "not-assigned");
});
