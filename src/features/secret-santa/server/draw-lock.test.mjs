import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";

import { isolatedModule } from "./draw-test-fixture.mjs";

function fixture(t) {
  const previous = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;
  process.env.DATABASE_URL = "postgresql://fixture:fixture@localhost/fixture?schema=public";
  delete process.env.DIRECT_URL;
  t.after(() => {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
    if (direct !== undefined) process.env.DIRECT_URL = direct;
  });
  const clients = [];
  const held = new Set();
  class Client extends EventEmitter {
    constructor() {
      super();
      clients.push(this);
    }
    async connect() {}
    async query(sql, values) {
      if (sql === "SELECT 1") return { rows: [] };
      this.key = values[0];
      this.acquired = !held.has(this.key);
      if (this.acquired) held.add(this.key);
      return { rows: [{ locked: this.acquired }] };
    }
    async end() {
      if (this.acquired) held.delete(this.key);
      this.closed = true;
      this.emit("end");
    }
  }
  return { ...isolatedModule("./draw-lock.ts", { pg: { Client } }), clients, held };
}

test("dedicated sessions reject contenders but allow independent events", async (t) => {
  const f = fixture(t);
  await f.withDrawLock("one", async ({ assertHeld }) => {
    await assertHeld();
    assert.equal(await f.withDrawLock("one", async () => assert.fail("Competing draw ran")), null);
    assert.equal(await f.withDrawLock("two", async () => "independent"), "independent");
  });
  assert.equal(f.held.size, 0);
  assert.ok(f.clients.every((client) => client.closed));
});

test("an exception releases the session lock", async (t) => {
  const f = fixture(t);
  await assert.rejects(
    f.withDrawLock("event", async () => {
      throw new Error("Fixture failure");
    }),
    /Fixture failure/,
  );
  assert.equal(await f.withDrawLock("event", async () => "recovered"), "recovered");
  assert.ok(f.clients.every((client) => client.closed));
});

test("connection loss makes further notification guards fail safely", async (t) => {
  const f = fixture(t);
  await f.withDrawLock("event", async ({ assertHeld }) => {
    f.clients[0].emit("error", new Error("fixture connection loss"));
    await assert.rejects(assertHeld(), /connexion au tirage a été interrompue/);
  });
  assert.equal(f.held.size, 0);
});
