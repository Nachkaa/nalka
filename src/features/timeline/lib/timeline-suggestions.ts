import { EventTimelineMomentKind } from "@prisma/client";

import type { MomentSuggestion } from "../types";
import { normalizeText } from "./timeline-utils";

const NEUTRAL_SUGGESTIONS: MomentSuggestion[] = [
  { title: "Accueil", kind: EventTimelineMomentKind.other },
  { title: "Activité", kind: EventTimelineMomentKind.other },
  { title: "Apéro", kind: EventTimelineMomentKind.reception },
  { title: "Dîner", kind: EventTimelineMomentKind.meal },
  { title: "Soirée", kind: EventTimelineMomentKind.party },
];

export function getMomentSuggestions(eventTitle: string): MomentSuggestion[] {
  const title = normalizeText(eventTitle);

  if (
    title.includes("mariage") ||
    title.includes("wedding") ||
    title.includes("ceremonie") ||
    title.includes("liste de mariage")
  ) {
    return [
      { title: "Cérémonie", kind: EventTimelineMomentKind.ceremony },
      { title: "Cocktail", kind: EventTimelineMomentKind.reception },
      { title: "Dîner", kind: EventTimelineMomentKind.meal },
      { title: "Soirée", kind: EventTimelineMomentKind.party },
      { title: "Brunch", kind: EventTimelineMomentKind.other },
    ];
  }

  if (
    title.includes("anniversaire") ||
    title.includes("birthday") ||
    title.includes("fete") ||
    title.includes("soir") ||
    title.includes("apero")
  ) {
    return [
      { title: "Brunch", kind: EventTimelineMomentKind.other },
      { title: "Activité", kind: EventTimelineMomentKind.other },
      { title: "Gâteau", kind: EventTimelineMomentKind.other },
      { title: "Apéro", kind: EventTimelineMomentKind.reception },
      { title: "Dîner", kind: EventTimelineMomentKind.meal },
      { title: "Soirée", kind: EventTimelineMomentKind.party },
    ];
  }

  if (
    title.includes("famille") ||
    title.includes("noel") ||
    title.includes("dejeuner") ||
    title.includes("repas")
  ) {
    return [
      { title: "Accueil", kind: EventTimelineMomentKind.other },
      { title: "Déjeuner", kind: EventTimelineMomentKind.meal },
      { title: "Activité", kind: EventTimelineMomentKind.other },
      { title: "Goûter", kind: EventTimelineMomentKind.other },
      { title: "Dîner", kind: EventTimelineMomentKind.meal },
    ];
  }

  return NEUTRAL_SUGGESTIONS;
}
