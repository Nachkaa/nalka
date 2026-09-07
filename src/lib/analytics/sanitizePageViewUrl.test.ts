import assert from "node:assert/strict";
import test from "node:test";

import {
  sanitizeCapturedUrl,
  sanitizePageViewUrl,
  sanitizePostHogProperties,
} from "./sanitizePageViewUrl";

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

test("sanitizes absolute and relative captured URLs and drops fragments", () => {
  assert.equal(
    sanitizeCapturedUrl("https://nalka.fr/login?from=%2Fevent%2Fnew%2Fclaim%3Fdraft%3Dsecret&intent=create-event#mail"),
    "https://nalka.fr/login?intent=create-event",
  );
  assert.equal(sanitizeCapturedUrl("/join?code=invite-secret&utm_source=mail"), "/join?utm_source=mail");
});

test("sanitizes PostHog URL properties, nested set-once properties and autocapture hrefs", () => {
  const properties = sanitizePostHogProperties({
    $current_url: "https://nalka.fr/event/new/claim?draft=current-secret",
    $initial_current_url: "https://nalka.fr/login?from=%2Fevent%2Fnew%2Fclaim%3Fdraft%3Dinitial-secret",
    $set_once: {
      $initial_current_url: "https://nalka.fr/join?code=set-once-secret",
      source: "homepage",
    },
    $elements: [
      {
        tag_name: "a",
        attr__href: "/login?from=%2Fevent%2Fnew%2Fclaim%3Fdraft%3Dhref-secret&intent=create-event",
      },
    ],
    safe_property: "keep-me",
  });

  assert.equal(properties.$current_url, "https://nalka.fr/event/new/claim");
  assert.equal(properties.$initial_current_url, "https://nalka.fr/login");
  assert.deepEqual(properties.$set_once, {
    $initial_current_url: "https://nalka.fr/join",
    source: "homepage",
  });
  assert.deepEqual(properties.$elements, [
    {
      tag_name: "a",
      attr__href: "/login?intent=create-event",
    },
  ]);
  assert.equal(properties.safe_property, "keep-me");
  assert.doesNotMatch(JSON.stringify(properties), /current-secret|initial-secret|set-once-secret|href-secret/);
});
