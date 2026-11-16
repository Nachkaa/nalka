import assert from "node:assert/strict";
import { test } from "node:test";

import { deferred, drawForm, loadDrawAction } from "./draw-test-fixture.mjs";

function fixture({ existing = false, denied = false, failWrite = false, mail } = {}) {
  const calls = { delete: 0, create: 0, mail: 0, refresh: 0 };
  let stored = existing ? [{ id: "old-one" }, { id: "old-two" }] : [];
  let locked = false;
  let generation = 0;
  const tx = {
    $queryRaw: async () => [{ id: "module" }],
    event: {
      findUnique: async () => ({
        title: "Fixture Santa",
        memberships: ["one", "two"].map((id) => ({
          user: { id, name: id, email: `${id}@example.test` },
        })),
      }),
    },
    secretSantaAssignment: {
      findMany: async () => stored.map((row) => ({ ...row })),
      deleteMany: async () => {
        calls.delete += 1;
        stored = [];
      },
      createMany: async ({ data }) => {
        calls.create += 1;
        if (failWrite) throw new Error("Write failed");
        generation += 1;
        stored = data.map((row) => ({ ...row, id: `draw-${generation}-${row.giverId}` }));
      },
    },
  };
  const prisma = {
    ...tx,
    $transaction: async (work) => {
      const previous = stored;
      try {
        return await work(tx);
      } catch (error) {
        stored = previous;
        throw error;
      }
    },
  };
  const action = loadDrawAction({
    prisma,
    access: async () => {
      if (denied) throw new Error("Forbidden");
      return { event: { id: "event", slug: "santa" }, eventModule: { id: "module" } };
    },
    mail: async () => {
      calls.mail += 1;
      await mail?.();
    },
    refresh: () => {
      calls.refresh += 1;
    },
    lock: async (_eventId, work) => {
      if (locked) return null;
      locked = true;
      try {
        return await work({ assertHeld: async () => {} });
      } finally {
        locked = false;
      }
    },
  });
  return {
    calls,
    form: drawForm("event", action.drawRevision(stored)),
    launch: action.launchDraw,
    assignments: () => stored,
  };
}

for (const confirmation of [undefined, "false", "yes"]) {
  test(`existing draw requires exact confirmation (${confirmation ?? "missing"})`, async () => {
    const { calls, form, launch } = fixture({ existing: true });
    if (confirmation === undefined) form.delete("confirmReplace");
    else form.set("confirmReplace", confirmation);
    assert.equal((await launch(form)).status, "requiresConfirmation");
    assert.deepEqual(calls, { delete: 0, create: 0, mail: 0, refresh: 0 });
  });
}

test("first draw remains a single action and returns an opaque revision", async () => {
  const { calls, form, launch } = fixture();
  const result = await launch(form);
  assert.equal(result.status, "completed");
  assert.match(result.drawRevision, /^[a-f0-9]{64}$/);
  assert.equal(result.notificationFailures, 0);
  assert.deepEqual(calls, { delete: 1, create: 1, mail: 2, refresh: 1 });
});

test("confirmed redraw replaces assignments and notifies participants", async () => {
  const { calls, form, launch } = fixture({ existing: true });
  form.set("confirmReplace", "true");
  assert.equal((await launch(form)).status, "completed");
  assert.deepEqual(calls, { delete: 1, create: 1, mail: 2, refresh: 1 });
});

test("confirmation does not bypass organizer authorization", async () => {
  const { calls, form, launch } = fixture({ denied: true });
  form.set("confirmReplace", "true");
  await assert.rejects(launch(form), /Forbidden/);
  assert.deepEqual(calls, { delete: 0, create: 0, mail: 0, refresh: 0 });
});

test("failed assignment writes preserve the previous draw and send nothing", async () => {
  const f = fixture({ existing: true, failWrite: true });
  f.form.set("confirmReplace", "true");
  await assert.rejects(f.launch(f.form), /Write failed/);
  assert.deepEqual(f.assignments(), [{ id: "old-one" }, { id: "old-two" }]);
  assert.equal(f.calls.mail, 0);
  assert.equal(f.calls.refresh, 0);
  await assert.rejects(f.launch(f.form), /Write failed/);
});

for (const existing of [false, true]) {
  test(`overlapping ${existing ? "redraws" : "first draws"} are rejected during email delivery`, async () => {
    const started = deferred();
    const finish = deferred();
    const f = fixture({
      existing,
      mail: async () => {
        started.resolve();
        await finish.promise;
      },
    });
    f.form.set("confirmReplace", "true");
    const first = f.launch(f.form);
    try {
      await started.promise;
      assert.deepEqual(await f.launch(f.form), { status: "busy" });
      assert.equal(f.calls.create, 1);
    } finally {
      finish.resolve();
    }
    assert.equal((await first).status, "completed");
    assert.equal(f.calls.mail, 2);
    assert.equal((await f.launch(f.form)).status, "stale");
    assert.equal(f.calls.create, 1);
    assert.equal(f.calls.mail, 2);
  });
}

test("a fresh confirmed revision permits a later intentional redraw", async () => {
  const f = fixture();
  const first = await f.launch(f.form);
  const second = await f.launch(drawForm("event", first.drawRevision, true));
  assert.equal(second.status, "completed");
  assert.notEqual(second.drawRevision, first.drawRevision);
  assert.equal(f.calls.create, 2);
});

test("SMTP failure preserves the saved draw, reports failures and never logs recipient data", async (t) => {
  const errors = [];
  t.mock.method(console, "error", (...args) => {
    errors.push(args);
  });
  const f = fixture({
    mail: async () => {
      throw new Error("recipient@example.test / private mapping");
    },
  });
  const result = await f.launch(f.form);
  assert.equal(result.status, "completed");
  assert.equal(result.notificationFailures, 2);
  assert.equal(f.assignments().length, 2);
  assert.doesNotMatch(JSON.stringify(errors), /recipient@example.test|private mapping/);
  assert.equal((await f.launch(f.form)).status, "stale");
  assert.equal(f.calls.mail, 2);
  assert.equal((await f.launch(drawForm("event", result.drawRevision, true))).status, "completed");
});

test("old clients without a revision cannot trigger an unchecked redraw", async () => {
  const f = fixture({ existing: true });
  f.form.delete("expectedRevision");
  await assert.rejects(f.launch(f.form), /Actualise la page/);
  assert.deepEqual(f.calls, { delete: 0, create: 0, mail: 0, refresh: 0 });
});
