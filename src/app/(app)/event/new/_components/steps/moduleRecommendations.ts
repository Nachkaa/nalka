import { EventLocationMode, EventModuleKey, EventScheduleMode } from "@prisma/client";

import type { Draft } from "../EventCreateStepper";

export type ModuleRecommendation = {
  moduleKey: EventModuleKey;
  confidence: "medium" | "high";
  reason: string;
};

export type ModuleRecommendationResult = {
  recommended: ModuleRecommendation[];
  available: EventModuleKey[];
};

const AVAILABLE_MODULES = [
  EventModuleKey.GIFTS,
  EventModuleKey.SECRET_SANTA,
  EventModuleKey.POTLUCK,
  EventModuleKey.TIMELINE,
  EventModuleKey.POLLS,
] as const;

const GIFT_KEYWORDS = ["anniversaire", "birthday", "noel", "christmas", "secret santa"] as const;
const SECRET_SANTA_KEYWORDS = [
  "noel",
  "christmas",
  "secret santa",
  "echange de cadeaux",
  "tirage au sort cadeau",
] as const;
const BRING_KEYWORDS = [
  "apero",
  "repas",
  "diner",
  "dejeuner",
  "barbecue",
  "bbq",
  "pique nique",
  "pique-nique",
  "chez",
  "brunch",
  "week end",
  "week-end",
] as const;
const TIMELINE_KEYWORDS = [
  "soiree",
  "fete",
  "anniversaire",
  "famille",
  "week end",
  "week-end",
  "road trip",
  "trip",
  "tournoi",
  "sortie",
  "journee",
  "club",
  "communaute",
  "rando",
] as const;
const POLL_KEYWORDS = [
  "trip",
  "road trip",
  "week end",
  "week-end",
  "meetup",
  "communaute",
  "club",
  "tournoi",
] as const;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(haystack: string, keywords: readonly string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function isOneOf<T extends string>(value: string | undefined, allowed: readonly T[]): value is T {
  return value !== undefined && allowed.includes(value as T);
}

function pushRecommendation(
  list: ModuleRecommendation[],
  moduleKey: EventModuleKey,
  confidence: "medium" | "high",
  reason: string,
) {
  if (list.some((item) => item.moduleKey === moduleKey)) return;
  list.push({ moduleKey, confidence, reason });
}

export function inferModuleRecommendations(draft: Draft): ModuleRecommendationResult {
  const text = normalize(
    [draft.title, draft.displayName, draft.description, draft.location]
      .filter(Boolean)
      .join(" "),
  );
  const theme = draft.theme;
  const recommended: ModuleRecommendation[] = [];

  const isSocialTheme = isOneOf(theme, ["social"]);
  const isFamilyTheme = isOneOf(theme, ["family"]);
  const isTripTheme = isOneOf(theme, ["trip"]);
  const isGroupTheme = isOneOf(theme, ["group"]);
  const isSportTheme = isOneOf(theme, ["sport"]);

  const hasGiftContext = containsAny(text, GIFT_KEYWORDS);
  const hasSecretSantaKeyword = containsAny(text, SECRET_SANTA_KEYWORDS);
  const hasSecretSantaContext =
    hasSecretSantaKeyword || ((isFamilyTheme || isGroupTheme) && hasSecretSantaKeyword);
  const hasBringContext = containsAny(text, BRING_KEYWORDS);
  const hasTimelineContext =
    containsAny(text, TIMELINE_KEYWORDS) ||
    isSocialTheme ||
    isFamilyTheme ||
    isTripTheme ||
    isGroupTheme ||
    isSportTheme;
  const needsPollCoordination =
    draft.scheduleMode !== EventScheduleMode.EXACT ||
    draft.locationMode !== EventLocationMode.EXACT ||
    isTripTheme ||
    isGroupTheme ||
    containsAny(text, POLL_KEYWORDS);

  if (hasGiftContext) {
    pushRecommendation(
      recommended,
      EventModuleKey.GIFTS,
      "high",
      "Recommandé car le contexte évoque un événement avec cadeaux.",
    );
  }

  if (hasSecretSantaContext) {
    pushRecommendation(
      recommended,
      EventModuleKey.SECRET_SANTA,
      "high",
      "Recommandé pour un échange de cadeaux privé, type Noël ou Secret Santa.",
    );
  }

  if (hasBringContext || isTripTheme) {
    pushRecommendation(
      recommended,
      EventModuleKey.POTLUCK,
      hasBringContext ? "high" : "medium",
      hasBringContext
        ? "Recommandé car l’événement ressemble à un repas, un apéro ou un moment chez quelqu’un."
        : "Recommandé car ce type de sortie demande souvent de répartir ce que chacun apporte.",
    );
  }

  if (hasTimelineContext) {
    pushRecommendation(
      recommended,
      EventModuleKey.TIMELINE,
      isTripTheme || isGroupTheme ? "high" : "medium",
      "Recommandé car cet événement a probablement plusieurs moments à coordonner.",
    );
  }

  if (needsPollCoordination) {
    pushRecommendation(
      recommended,
      EventModuleKey.POLLS,
      draft.scheduleMode !== EventScheduleMode.EXACT || draft.locationMode !== EventLocationMode.EXACT
        ? "high"
        : "medium",
      "Recommandé car la date, le lieu ou l’organisation du groupe demandent encore de la coordination.",
    );
  }

  const recommendedKeys = new Set(recommended.map((item) => item.moduleKey));

  return {
    recommended,
    available: AVAILABLE_MODULES.filter((moduleKey) => !recommendedKeys.has(moduleKey)),
  };
}
