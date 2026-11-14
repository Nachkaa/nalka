import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const load = createRequire(import.meta.url);

function isolatedModule(path, mocks) {
  const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const fixtureModule = { exports: {} };
  vm.runInThisContext(`(function(require, module, exports) {${source}\n})`)(
    (name) => (name in mocks ? mocks[name] : load(name)),
    fixtureModule,
    fixtureModule.exports,
  );
  return fixtureModule.exports;
}

const policy = isolatedModule("../email-domain-policy.ts", {});

function inviteFixture(role = "OWNER") {
  const calls = { memberships: 0, mail: 0 };
  const action = isolatedModule("../../../app/(app)/event/[slug]/actions/participants.ts", {
    "@/auth": {
      auth: async () => ({ user: { email: "organizer@example.test" } }),
      signIn: async () => {
        calls.mail += 1;
        return { ok: true };
      },
    },
    "@/features/events/email-domain-policy": policy,
    "@/features/gifts/server/lifecycle": {},
    "@/lib/rate-limit": { limit: async () => {} },
    "@/lib/req": { getClientIp: async () => "fixture" },
    "next/cache": { revalidatePath: () => {} },
    "@/lib/prisma": {
      prisma: {
        user: {
          findUnique: async () => ({ id: "organizer", name: "Organizer" }),
          upsert: async () => ({ id: "invitee" }),
        },
        eventMember: {
          findUnique: async () => ({ role }),
          upsert: async () => {
            calls.memberships += 1;
          },
        },
        event: {
          findUnique: async () => ({
            id: "event",
            slug: "event",
            title: "Event",
            modules: [],
            allowedEmailDomains: ["departement06.fr"],
          }),
        },
      },
    },
  });
  const form = new FormData();
  form.set("eventId", "event");
  form.set("email", "external@contractor.test");
  return { calls, form, invite: action.inviteMember };
}

test("external email invitations require an explicit organizer exception", async () => {
  const { calls, form, invite } = inviteFixture();
  assert.deepEqual(await invite(form), { ok: false, requiresDomainException: true });
  assert.deepEqual(calls, { memberships: 0, mail: 0 });
});

test("confirmed organizer exceptions grant only the addressed account membership", async () => {
  const { calls, form, invite } = inviteFixture();
  form.set("allowExternalEmail", "on");
  assert.deepEqual(await invite(form), { ok: true });
  assert.deepEqual(calls, { memberships: 1, mail: 1 });
});

test("a participant cannot grant an external exception", async () => {
  const { calls, form, invite } = inviteFixture("MEMBER");
  form.set("allowExternalEmail", "on");
  await assert.rejects(invite(form), /Forbidden/);
  assert.deepEqual(calls, { memberships: 0, mail: 0 });
});

test("an allowed email invitation does not require an exception", async () => {
  const { calls, form, invite } = inviteFixture("ADMIN");
  form.set("email", "colleague@departement06.fr");
  assert.deepEqual(await invite(form), { ok: true });
  assert.deepEqual(calls, { memberships: 1, mail: 1 });
});

test("access policy updates require organizer authorization before any write", async () => {
  let writes = 0;
  const { updateEventEmailDomains } = isolatedModule("./email-domain-access.ts", {
    "@/features/events/access": {
      requireEventOrganizer: async () => {
        throw new Error("Forbidden");
      },
    },
    "@/features/events/email-domain-policy": policy,
    "@/lib/prisma": {
      prisma: {
        event: {
          update: async () => {
            writes += 1;
          },
        },
      },
    },
    "next/cache": { revalidatePath: () => {} },
  });
  await assert.rejects(updateEventEmailDomains("another-event", new FormData()), /Forbidden/);
  assert.equal(writes, 0);
});
