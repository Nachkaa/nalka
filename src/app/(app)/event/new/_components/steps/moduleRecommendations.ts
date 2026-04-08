import { EventModuleKey } from "@prisma/client";

import type { Draft } from "../EventCreateStepper";

type ModuleConfidence = "medium" | "high";

export type ModuleRecommendation = {
  moduleKey: EventModuleKey;
  confidence: ModuleConfidence;
  reason: string;
  suggested: true;
  autoAdded: boolean;
};

const HIGH_SIGNALS = [
  "anniversaire",
  "noel",
  "secret santa",
  "baby shower",
  "mariage",
  "liste de mariage",
  "naissance",
  "bapteme",
  "saint valentin",
] as const;

const MEDIUM_SIGNALS = [
  "cousinade",
  "repas de famille",
  "diner",
  "week-end famille",
  "week end famille",
  "soiree",
  "pot de depart",
] as const;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findSignal(value: string, signals: readonly string[]) {
  const haystack = normalize(value);
  if (!haystack) return null;

  for (const signal of signals) {
    if (haystack.includes(signal)) return signal;
  }

  return null;
}

function formatSignal(signal: string) {
  if (signal === "noel") return "Noël";
  if (signal === "saint valentin") return "Saint-Valentin";
  if (signal === "baby shower") return "baby shower";
  if (signal === "secret santa") return "Secret Santa";
  return signal;
}

function reasonFromMatch(scope: "title" | "description", signal: string, autoAdded: boolean) {
  const source = scope === "title" ? "le titre" : "la description";
  const verb = autoAdded ? "évoque" : "ressemble à";
  return `${autoAdded ? "Ajouté" : "Recommandé"} car ${source} ${verb} ${formatSignal(signal)}`;
}

export function inferModuleRecommendations(draft: Draft): ModuleRecommendation[] {
  const titleHitHigh = findSignal(draft.title, HIGH_SIGNALS);
  if (titleHitHigh) {
    return [
      {
        moduleKey: EventModuleKey.GIFTS,
        confidence: "high",
        reason: reasonFromMatch("title", titleHitHigh, true),
        suggested: true,
        autoAdded: true,
      },
    ];
  }

  const descriptionHitHigh = findSignal(draft.description, HIGH_SIGNALS);
  if (descriptionHitHigh) {
    return [
      {
        moduleKey: EventModuleKey.GIFTS,
        confidence: "high",
        reason: reasonFromMatch("description", descriptionHitHigh, true),
        suggested: true,
        autoAdded: true,
      },
    ];
  }

  const titleHitMedium = findSignal(draft.title, MEDIUM_SIGNALS);
  if (titleHitMedium) {
    return [
      {
        moduleKey: EventModuleKey.GIFTS,
        confidence: "medium",
        reason: reasonFromMatch("title", titleHitMedium, false),
        suggested: true,
        autoAdded: false,
      },
    ];
  }

  const descriptionHitMedium = findSignal(draft.description, MEDIUM_SIGNALS);
  if (descriptionHitMedium) {
    return [
      {
        moduleKey: EventModuleKey.GIFTS,
        confidence: "medium",
        reason: reasonFromMatch("description", descriptionHitMedium, false),
        suggested: true,
        autoAdded: false,
      },
    ];
  }

  return [];
}
