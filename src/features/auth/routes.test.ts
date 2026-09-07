import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { AUTH_ENTRY_PATH, getAuthEntryUrl } from "./routes";

test("auth entry path is canonical", () => {
  assert.equal(AUTH_ENTRY_PATH, "/login");
  assert.equal(getAuthEntryUrl(), "/login");
});

test("auth entry helper preserves safe internal destinations", () => {
  assert.equal(getAuthEntryUrl("/event"), "/login?from=%2Fevent");
});

test("unsafe external destinations fall back to the canonical login", () => {
  assert.equal(getAuthEntryUrl("https://example.com"), "/login");
  assert.equal(getAuthEntryUrl("//example.com"), "/login");
});

test("protected app layout uses the canonical auth entry", async () => {
  const source = await readFile(new URL("../../app/(app)/layout.tsx", import.meta.url), "utf-8");

  assert.match(source, /redirect\(AUTH_ENTRY_PATH\)/);
  assert.doesNotMatch(source, /redirect\(["']\/signin["']\)/);
  assert.doesNotMatch(source, /redirect\(["']\/login["']\)/);
});

test("event page has no legacy signin redirect", async () => {
  const source = await readFile(
    new URL("../../app/(app)/event/page.tsx", import.meta.url),
    "utf-8",
  );

  assert.doesNotMatch(source, /redirect\(["']\/signin["']\)/);
  assert.equal(source.match(/redirect\(getAuthEntryUrl\("\/event"\)\)/g)?.length, 2);
});
