import assert from "node:assert/strict";
import test from "node:test";

import { EventLocationMode, EventModuleKey, EventScheduleMode } from "@prisma/client";

import type { Draft } from "../EventCreateStepper";
import { inferModuleRecommendations } from "./moduleRecommendations";
import { isChristmasSeason } from "@/features/events/christmas-season";
import { getTitleSuggestions } from "./titleSuggestions";

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
    restrictEmailDomains: false,
    allowedEmailDomains: [],
  };
}

for (const theme of PROFESSIONAL_THEMES) {
  test(`recommends Budget for professional theme ${theme}`, () => {
    const draft = makeDraft(theme);
    const result = inferModuleRecommendations(draft);
    const recommendation = result.recommended.find(
      (item) => item.moduleKey === EventModuleKey.BUDGET,
    );

    assert.ok(recommendation);
    assert.equal(recommendation.confidence, "high");
    assert.match(recommendation.reason, /dépenses/i);
    assert.equal(result.available.includes(EventModuleKey.BUDGET), false);
    assert.equal(draft.budgetEnabled, false);
  });
}

test("does not falsely recommend Budget for association/group", () => {
  const result = inferModuleRecommendations(makeDraft("group"));

  assert.equal(
    result.recommended.some((item) => item.moduleKey === EventModuleKey.BUDGET),
    false,
  );
  assert.equal(result.available.includes(EventModuleKey.BUDGET), true);
});

test("does not falsely recommend Budget for custom events", () => {
  const result = inferModuleRecommendations(makeDraft("custom"));

  assert.equal(
    result.recommended.some((item) => item.moduleKey === EventModuleKey.BUDGET),
    false,
  );
  assert.equal(result.available.includes(EventModuleKey.BUDGET), true);
});

test("Christmas is available to ordinary groups without enabling anything automatically", () => {
  const draft = makeDraft("christmas");
  const result = inferModuleRecommendations(draft);
  assert.equal(result.christmasContext, "explicit");
  assert.equal(result.recommended[0].moduleKey, EventModuleKey.SECRET_SANTA);
  assert.equal(result.recommended[0].confidence, "high");
  assert.ok(result.recommended.some((item) => item.moduleKey === EventModuleKey.GIFTS));
  assert.equal(
    result.recommended.some((item) => item.moduleKey === EventModuleKey.BUDGET),
    false,
  );
  assert.equal(draft.giftMode, null);
  assert.equal(draft.secretSantaEnabled, false);
  assert.ok(getTitleSuggestions(draft).includes("Noël en famille"));
});

for (const title of ["Noël en famille", "Christmas with friends", "Secret-Santa de l'équipe"]) {
  test(`recommends a private gift exchange for ${title}, even outside winter`, () => {
    const result = inferModuleRecommendations({ ...makeDraft("custom"), title });
    assert.equal(result.christmasContext, "explicit");
    assert.match(result.recommended[0].reason, /famille.*amis.*collègues/);
    assert.equal(result.available.includes(EventModuleKey.SECRET_SANTA), false);
  });
}

for (const scheduleDate of ["2026-11-16", "2026-12-24"]) {
  test(`offers an optional seasonal exchange for ${scheduleDate}`, () => {
    const result = inferModuleRecommendations({ ...makeDraft("custom"), scheduleDate });
    assert.equal(result.christmasContext, "seasonal");
    assert.equal(result.recommended[0].confidence, "medium");
  });
}

test("does not mistake a person's name or a venue for a Christmas occasion", () => {
  const result = inferModuleRecommendations({
    ...makeDraft("custom"),
    displayName: "Noël",
    location: "Maison de Noël",
  });
  assert.equal(result.christmasContext, null);
  assert.equal(
    result.recommended.some((item) => item.moduleKey === EventModuleKey.SECRET_SANTA),
    false,
  );
  assert.equal(
    result.recommended.some((item) => item.moduleKey === EventModuleKey.GIFTS),
    false,
  );
});

test("ignores an obsolete exact date when the date is now undecided", () => {
  const result = inferModuleRecommendations({
    ...makeDraft("custom"),
    scheduleMode: EventScheduleMode.TBD,
    scheduleDate: "2026-12-24",
  });
  assert.equal(result.christmasContext, null);
});

test("recommendations preserve independent manual gift choices", () => {
  const draft: Draft = {
    ...makeDraft("christmas"),
    giftMode: "HOST_LIST",
    secretSantaEnabled: false,
  };
  const before = structuredClone(draft);
  inferModuleRecommendations(draft);
  assert.deepEqual(draft, before);
});

test("the homepage seasonal entry has recurring November–December boundaries", () => {
  assert.equal(isChristmasSeason(new Date("2026-10-31T23:59:59Z")), false);
  assert.equal(isChristmasSeason(new Date("2026-11-01T00:00:00Z")), true);
  assert.equal(isChristmasSeason(new Date("2026-12-31T23:59:59Z")), true);
  assert.equal(isChristmasSeason(new Date("2027-01-01T00:00:00Z")), false);
});
