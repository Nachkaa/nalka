import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const load = createRequire(import.meta.url);
const source = ts.transpileModule(
  readFileSync(new URL("./mutations.ts", import.meta.url), "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText;

function fixture({ existing = false, denied = false, failWrite = false } = {}) {
  const calls = { delete: 0, create: 0, mail: 0, refresh: 0 };
  const assignments = {
    findFirst: async () => (existing ? { id: "existing-draw" } : null),
    deleteMany: async () => {
      calls.delete += 1;
    },
    createMany: async () => {
      calls.create += 1;
      if (failWrite) throw new Error("Write failed");
    },
  };
  const mocks = {
    "@react-email/render": { render: async () => "fixture email" },
    "@prisma/client": { EventModuleKey: { SECRET_SANTA: "SECRET_SANTA" } },
    "next/cache": {
      revalidatePath: () => {
        calls.refresh += 1;
      },
    },
    "@/emails/SecretSantaAssignedEmail": { default: () => null },
    "@/features/events/access": {
      requireEnabledModule: async () => {
        if (denied) throw new Error("Forbidden");
        return { event: { id: "event", slug: "santa" } };
      },
    },
    "@/lib/mail": {
      sendMail: async () => {
        calls.mail += 1;
      },
    },
    "@/lib/prisma": {
      prisma: {
        event: {
          findUnique: async () => ({
            title: "Fixture Santa",
            memberships: ["one", "two"].map((id) => ({
              user: { id, name: id, email: `${id}@example.test` },
            })),
          }),
        },
        $transaction: async (fn) => fn({ secretSantaAssignment: assignments }),
      },
    },
  };
  const fixtureModule = { exports: {} };
  const run = vm.runInThisContext(`(function(require, module, exports) {${source}\n})`);
  run((name) => (name in mocks ? mocks[name] : load(name)), fixtureModule, fixtureModule.exports);
  const form = new FormData();
  form.set("eventId", "event");
  form.set("slug", "santa");
  return { calls, form, launch: fixtureModule.exports.launchDraw };
}

for (const confirmation of [undefined, "false", "yes"]) {
  test(`existing draw requires exact confirmation (${confirmation ?? "missing"})`, async () => {
    const { calls, form, launch } = fixture({ existing: true });
    if (confirmation !== undefined) form.set("confirmReplace", confirmation);
    assert.equal((await launch(form)).requiresConfirmation, true);
    assert.deepEqual(calls, { delete: 0, create: 0, mail: 0, refresh: 0 });
  });
}

test("first draw remains a single action", async () => {
  const { calls, form, launch } = fixture();
  assert.equal((await launch(form)).requiresConfirmation, false);
  assert.deepEqual(calls, { delete: 1, create: 1, mail: 2, refresh: 1 });
});

test("confirmed redraw replaces assignments and notifies participants", async () => {
  const { calls, form, launch } = fixture({ existing: true });
  form.set("confirmReplace", "true");
  assert.equal((await launch(form)).requiresConfirmation, false);
  assert.deepEqual(calls, { delete: 1, create: 1, mail: 2, refresh: 1 });
});

test("confirmation does not bypass organizer authorization", async () => {
  const { calls, form, launch } = fixture({ denied: true });
  form.set("confirmReplace", "true");
  await assert.rejects(launch(form), /Forbidden/);
  assert.deepEqual(calls, { delete: 0, create: 0, mail: 0, refresh: 0 });
});

test("failed assignment writes do not send notifications", async () => {
  const { calls, form, launch } = fixture({ failWrite: true });
  await assert.rejects(launch(form), /Write failed/);
  assert.equal(calls.mail, 0);
  assert.equal(calls.refresh, 0);
});
