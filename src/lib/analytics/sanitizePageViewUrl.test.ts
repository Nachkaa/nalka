import assert from "node:assert/strict";
import test from "node:test";

import { sanitizePageViewUrl } from "./sanitizePageViewUrl";

const origin = "https://nalka.fr";

test("keeps safe product and attribution parameters", () => {
  assert.equal(
    sanitizePageViewUrl(origin, "/login", "intent=create-event&utm_source=homepage"),
    "https://nalka.fr/login?intent=create-event&utm_source=homepage",
  );
});

test("removes direct draft and authentication secrets", () => {
  const url = sanitizePageViewUrl(
    origin,
    "/event/new/claim",
    "draft=super-secret&token=token-secret&code=invite-secret&intent=create-event",
  );

  assert.equal(url, "https://nalka.fr/event/new/claim?intent=create-event");
  assert.doesNotMatch(url, /super-secret|token-secret|invite-secret/);
});

test("removes navigation parameters that may contain nested secrets", () => {
  const from = encodeURIComponent("/event/new/claim?draft=nested-secret");
  const callbackUrl = encodeURIComponent("/event/new/claim?draft=callback-secret");
  const url = sanitizePageViewUrl(
    origin,
    "/login",
    `from=${from}&callbackUrl=${callbackUrl}&intent=create-event`,
  );

  assert.equal(url, "https://nalka.fr/login?intent=create-event");
  assert.doesNotMatch(url, /nested-secret|callback-secret/);
});

test("removes sensitive keys case-insensitively", () => {
  assert.equal(
    sanitizePageViewUrl(origin, "/join", "Code=secret&UTM_SOURCE=test"),
    "https://nalka.fr/join?UTM_SOURCE=test",
  );
});
