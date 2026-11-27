import type { Draft } from "../EventCreateStepper";

const byTheme: Record<NonNullable<Draft["theme"]>, string[]> = {
  christmas: ["Noël en famille", "Secret Santa entre amis", "Repas de Noël", "Noël entre amis"],
  social: ["Anniversaire entre amis", "Dîner entre amis", "Barbecue du week-end", "Soirée jeux"],
  family: ["Repas de famille", "Anniversaire en famille", "Cousinade", "Retrouvailles en famille"],
  sport: ["Randonnée entre amis", "Sortie à vélo", "Tournoi du week-end", "Journée en plein air"],
  trip: ["Week-end au ski", "Vacances entre amis", "Escapade en famille", "Un week-end ensemble"],
  group: ["Repas de l'association", "Sortie du club", "Rencontre du groupe", "Fête des voisins"],
  custom: ["Un moment ensemble", "Une journée à partager", "Retrouvailles", "Une belle occasion"],
};

export function getTitleSuggestions(draft: Draft): string[] {
  return byTheme[draft.theme ?? "custom"];
}
