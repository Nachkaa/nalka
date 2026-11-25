import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  EventDetailsSchema,
} from "@/domain/events";
import { parseEventCreateFormData } from "./server/create-event";

const skiDescription =
  "On remet ça ! Une semaine à la montagne, avec du ski, du fromage et suffisamment de jeux de société pour occuper toutes les soirées 🍷 Comme chaque année, il y aura ceux qui veulent prendre la première benne et ceux qui négocient encore cinq minutes (ou 2h... je sais, tu sais, on sait) au lit Des années après l’école, on n’a toujours pas résolu l’équation : skier comme un pro le matin + bien manger le midi + se laisser rouler sur les piste l'aprem +faire l’apéro + se coucher tard. Mais on va retenter. 😎";
const pollDates = ["2027-01-09", "2027-01-16", "2027-01-23", "2027-01-30", "2027-02-06"];
const pollLocations = ["🏔️ Serre Chevalier", "🎿 Tignes", "💡 Une autre station"];

function buildSkiFormData() {
  const formData = new FormData();
  formData.set("title", "⛷️ Ski, chalet & jeux 🎲");
  formData.set("description", skiDescription);
  formData.set("schedule.mode", "POLL");
  formData.set("schedule.time", "");
  for (const date of pollDates) formData.append("schedule.options", date);
  formData.set("location.mode", "POLL");
  for (const location of pollLocations) formData.append("location.options", location);
  formData.set("rules.isNoSpoil", "on");
  formData.set("rules.isAnonReservations", "on");
  return formData;
}

test("ski trip description and both polls are accepted without enabling gift modules", () => {
  assert.ok(skiDescription.length > 500, "Reproduce the former hidden description limit");
  assert.ok(EventDetailsSchema.safeParse({ title: "Ski", description: skiDescription }).success);

  const data = parseEventCreateFormData(buildSkiFormData());
  assert.equal(data.description, skiDescription);
  assert.deepEqual(data.schedule, { mode: "POLL", options: pollDates, time: null });
  assert.deepEqual(data.location, { mode: "POLL", options: pollLocations });
  assert.equal(data.giftsEnabled, false);
  assert.equal(data.secretSantaEnabled, false);
  assert.equal(data.bringEnabled, false);
  assert.equal(data.budgetEnabled, false);
  assert.equal(data.isNoSpoil, true);
  assert.equal(data.isAnonReservations, true);
  assert.deepEqual(data.allowedEmailDomains, []);
});

test("client and server accept the description boundary and reject longer text", () => {
  const formData = buildSkiFormData();
  const description = "a".repeat(EVENT_DESCRIPTION_MAX_LENGTH);
  formData.set("description", description);
  assert.equal(parseEventCreateFormData(formData).description, description);
  assert.ok(EventDetailsSchema.safeParse({ title: "Ski", description }).success);

  formData.set("description", `${description}a`);
  assert.throws(() => parseEventCreateFormData(formData));
  const result = EventDetailsSchema.safeParse({ title: "Ski", description: `${description}a` });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0].path[0], "description");
    assert.match(result.error.issues[0].message, /1000 caractères/);
  }
});

test("title validation rejects blank or oversized names with an actionable message", () => {
  const formData = buildSkiFormData();
  for (const title of ["   ", "a".repeat(EVENT_TITLE_MAX_LENGTH + 1)]) {
    assert.equal(EventDetailsSchema.safeParse({ title }).success, false);
    formData.set("title", title);
    assert.throws(() => parseEventCreateFormData(formData));
  }
  formData.set("title", "a".repeat(EVENT_TITLE_MAX_LENGTH));
  assert.equal(parseEventCreateFormData(formData).title.length, EVENT_TITLE_MAX_LENGTH);
});

for (const scheduleMode of ["EXACT", "POLL", "TBD"] as const) {
  for (const locationMode of ["EXACT", "POLL", "TBD"] as const) {
    test(`event creation still accepts ${scheduleMode} schedule / ${locationMode} location`, () => {
      const formData = buildSkiFormData();
      formData.set("schedule.mode", scheduleMode);
      formData.set("schedule.date", "2099-01-09");
      formData.set("schedule.time", "19:00");
      formData.set("location.mode", locationMode);
      formData.set("location.value", "Tignes");
      formData.set("description", "");
      const data = parseEventCreateFormData(formData);
      assert.equal(data.schedule.mode, scheduleMode);
      assert.equal(data.schedule.time, "19:00");
      assert.equal(data.location.mode, locationMode);
      assert.equal(data.description, null);
    });
  }
}
