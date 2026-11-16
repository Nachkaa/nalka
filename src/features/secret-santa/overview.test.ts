import assert from "node:assert/strict";
import { test } from "node:test";

import { buildSecretSantaOverviewCard, type SecretSantaOverview } from "./overview";

const base: SecretSantaOverview = {
  state: "waiting",
  membersCount: 1,
  canManage: false,
  budgetCapCents: null,
};

test("participants see waiting information, never a draw action", () => {
  for (const membersCount of [1, 2, 50]) {
    const card = buildSecretSantaOverviewCard({ ...base, membersCount });
    assert.equal(card.title, "En attente du tirage");
    assert.equal(card.action, "Voir le Secret Santa");
  }
});

test("organizers are guided to gather participants before preparing a draw", () => {
  const card = buildSecretSantaOverviewCard({ ...base, canManage: true });
  assert.match(card.title, /Invitez/);
  assert.match(card.description, /deux participants/);
  assert.equal(card.action, "Inviter des participants");
});

test("organizers with two registered participants can prepare the draw", () => {
  const card = buildSecretSantaOverviewCard({ ...base, canManage: true, membersCount: 2 });
  assert.equal(card.action, "Préparer le tirage");
  assert.match(card.description, /budget/);
});

test("assigned participants are sent to their private attribution", () => {
  const card = buildSecretSantaOverviewCard({ ...base, state: "assigned" });
  assert.equal(card.action, "Voir mon attribution");
  assert.equal(card.badge, "Tirage effectué");
  assert.match(card.description, /espace privé/);
});

test("missing assignments after a draw do not suggest automatic reassignment", () => {
  const participant = buildSecretSantaOverviewCard({ ...base, state: "not-assigned" });
  assert.match(participant.description, /Contactez l'organisateur/);
  const organizer = buildSecretSantaOverviewCard({
    ...base,
    state: "not-assigned",
    canManage: true,
  });
  assert.equal(organizer.action, "Vérifier le Secret Santa");
});
