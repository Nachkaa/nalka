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
  EventModuleKey.BUDGET,
] as const;

const GIFT_KEYWORDS = [
  "anniversaire",
  "birthday",
  "noel",
  "christmas",
  "secret santa",
  "cadeau",
  "gift",
] as const;

const SECRET_SANTA_KEYWORDS = [
  "noel",
  "christmas",
  "secret santa",
  "echange de cadeaux",
  "tirage au sort cadeau",
] as const;

const CONTRIBUTION_KEYWORDS = [
  "materiel",
  "logistique",
  "boissons",
  "collation",
  "traiteur",
  "equipement",
  "stand",
  "accueil",
] as const;

const TIMELINE_KEYWORDS = [
  "seminaire",
  "client",
  "partenaire",
  "lancement",
  "produit",
  "offsite",
  "programme",
  "planning",
  "tournoi",
  "journee",
  "club",
  "communaute",
  "association",
] as const;

const POLL_KEYWORDS = [
  "decision",
  "arbitrage",
  "date",
  "lieu",
  "offsite",
  "seminaire",
  "meetup",
  "communaute",
  "club",
  "association",
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

  const isProfessionalTheme = isOneOf(theme, ["social", "family", "sport", "trip", "group"]);
  const hasGiftContext = containsAny(text, GIFT_KEYWORDS);
  const hasSecretSantaContext = containsAny(text, SECRET_SANTA_KEYWORDS);
  const hasContributionContext = containsAny(text, CONTRIBUTION_KEYWORDS);
  const hasTimelineContext = containsAny(text, TIMELINE_KEYWORDS) || isProfessionalTheme;
  const needsPollCoordination =
    draft.scheduleMode !== EventScheduleMode.EXACT ||
    draft.locationMode !== EventLocationMode.EXACT ||
    isOneOf(theme, ["trip", "group"]) ||
    containsAny(text, POLL_KEYWORDS);

  if (hasTimelineContext) {
    pushRecommendation(
      recommended,
      EventModuleKey.TIMELINE,
      isProfessionalTheme ? "high" : "medium",
      "Recommandé pour structurer le programme et les temps forts.",
    );
  }

  if (needsPollCoordination) {
    pushRecommendation(
      recommended,
      EventModuleKey.POLLS,
      draft.scheduleMode !== EventScheduleMode.EXACT || draft.locationMode !== EventLocationMode.EXACT
        ? "high"
        : "medium",
      "Recommandé pour trancher une date, un lieu ou une décision d'organisation.",
    );
  }

  if (hasContributionContext) {
    pushRecommendation(
      recommended,
      EventModuleKey.POTLUCK,
      "medium",
      "Utile si vous devez répartir du matériel, des boissons ou des apports.",
    );
  }

  if (hasGiftContext) {
    pushRecommendation(
      recommended,
      EventModuleKey.GIFTS,
      "medium",
      "Utile uniquement si cet événement inclut une liste de cadeaux ou de recommandations.",
    );
  }

  if (hasSecretSantaContext) {
    pushRecommendation(
      recommended,
      EventModuleKey.SECRET_SANTA,
      "medium",
      "Utile uniquement pour un rituel d'équipe de type Secret Santa.",
    );
  }

  const recommendedKeys = new Set(recommended.map((item) => item.moduleKey));

  return {
    recommended,
    available: AVAILABLE_MODULES.filter((moduleKey) => !recommendedKeys.has(moduleKey)),
  };
}
