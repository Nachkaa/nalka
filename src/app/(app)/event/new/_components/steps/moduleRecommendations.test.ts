import assert from "node:assert/strict";
import test from "node:test";

import { EventLocationMode, EventModuleKey, EventScheduleMode } from "@prisma/client";

import type { Draft } from "../EventCreateStepper";
import { inferModuleRecommendations } from "./moduleRecommendations";

const PROFESSIONAL_THEMES = ["social", "family", "sport", "trip"] as const;

function makeDraft(theme: Draft["theme"]): Draft {
  return {
    theme,
    displayName: "Aurèle",
    title: "Événement test",
    description: "",
    location: "Nice",
    locationMode: EventLocationMode.EXACT,
    pollLocations: [],
    scheduleMode: EventScheduleMode.EXACT,
    scheduleDate: "2026-10-15",
    scheduleTime: "09:00",
    pollDates: [],
    giftMode: null,
    secretSantaEnabled: false,
    bringEnabled: false,
    timelineEnabled: false,
    budgetEnabled: false,
  };
}

for (const theme of PROFESSIONAL_THEMES) {
  test(`recommends Provider Cockpit for professional theme ${theme}`, () => {
    const draft = makeDraft(theme);
    const result = inferModuleRecommendations(draft);
    const recommendation = result.recommended.find(
      (item) => item.moduleKey === EventModuleKey.BUDGET,
    );

    assert.ok(recommendation);
    assert.equal(recommendation.confidence, "high");
    assert.match(recommendation.reason, /prestataires/i);
    assert.equal(result.available.includes(EventModuleKey.BUDGET), false);
    assert.equal(draft.budgetEnabled, false);
  });
}

test("does not falsely recommend Provider Cockpit for association/group", () => {
  const result = inferModuleRecommendations(makeDraft("group"));

  assert.equal(
    result.recommended.some((item) => item.moduleKey === EventModuleKey.BUDGET),
    false,
  );
  assert.equal(result.available.includes(EventModuleKey.BUDGET), true);
});

test("does not falsely recommend Provider Cockpit for custom events", () => {
  const result = inferModuleRecommendations(makeDraft("custom"));

  assert.equal(
    result.recommended.some((item) => item.moduleKey === EventModuleKey.BUDGET),
    false,
  );
  assert.equal(result.available.includes(EventModuleKey.BUDGET), true);
});
