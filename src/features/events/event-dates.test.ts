import assert from "node:assert/strict";
import { test } from "node:test";

import { getEventDateKey } from "./event-dates";

for (const [timestamp, expected] of [
  ["2026-11-22T22:59:59.000Z", "2026-11-22"],
  ["2026-11-22T23:00:00.000Z", "2026-11-23"],
  ["2026-07-01T21:59:59.000Z", "2026-07-01"],
  ["2026-07-01T22:00:00.000Z", "2026-07-02"],
  ["2026-03-29T01:30:00.000Z", "2026-03-29"],
  ["2026-10-25T01:30:00.000Z", "2026-10-25"],
  ["2026-12-31T23:00:00.000Z", "2027-01-01"],
]) {
  test(`event calendar uses the Paris date at ${timestamp}`, () => {
    assert.equal(getEventDateKey(new Date(timestamp)), expected);
  });
}
