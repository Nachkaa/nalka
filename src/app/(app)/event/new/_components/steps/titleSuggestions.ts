import type { Draft } from "../EventCreateStepper";

type Theme = Draft["theme"];

type Suggestion = { emoji: string; title: string };

const byTheme: Record<Exclude<Theme, undefined>, Suggestion[]> = {
  social: [
    { emoji: "🎂", title: "Anniversaire — {name}" },
    { emoji: "🥂", title: "Soirée chez {name}" },
    { emoji: "🍷", title: "Apéro {city}" },
    { emoji: "❤️", title: "Saint Valentin" },
    { emoji: "🎉", title: "Fête à la maison" },
    { emoji: "👋", title: "Pot de départ" },
    { emoji: "🍽️", title: "Dîner entre amis" },
  ],
  family: [
    { emoji: "🏡", title: "Week-end famille" },
    { emoji: "🍲", title: "Déjeuner chez {name}" },
    { emoji: "🍽️", title: "Repas de famille" },
    { emoji: "🧑‍🤝‍🧑", title: "Cousinade" },
    { emoji: "🎄", title: "Noël en famille" },
    { emoji: "📸", title: "Réunion familiale" },
  ],
  sport: [
    { emoji: "🚴", title: "Sortie vélo" },
    { emoji: "🏃", title: "Run du dimanche" },
    { emoji: "⚽", title: "Match entre amis" },
    { emoji: "🏋️", title: "Séance training" },
    { emoji: "🏆", title: "Tournoi" },
    { emoji: "🥾", title: "Rando" },
  ],
  trip: [
    { emoji: "🧳", title: "Week-end à {city}" },
    { emoji: "🚗", title: "Road trip" },
    { emoji: "🎿", title: "Séjour au ski" },
    { emoji: "🏖️", title: "Vacances ensemble" },
    { emoji: "🏙️", title: "City trip" },
    { emoji: "🌅", title: "Escapade" },
  ],
  group: [
    { emoji: "🍻", title: "Afterwork" },
    { emoji: "🍽️", title: "Team dinner" },
    { emoji: "🗓️", title: "Meetup" },
    { emoji: "🏛️", title: "Événement du club" },
    { emoji: "🧠", title: "Réunion + apéro" },
    { emoji: "🤝", title: "Sortie communauté" },
  ],
  custom: [
    { emoji: "✨", title: "Mon événement" },
    { emoji: "🧭", title: "Planification" },
    { emoji: "📍", title: "Rendez-vous" },
    { emoji: "💫", title: "Moment ensemble" },
  ],
};

function applyTemplate(t: string, name: string) {
  const safeName = (name || "…").trim() || "…";
  return t.replace("{name}", safeName).replace("{city}", "…");
}

export function getTitleSuggestions(draft: Draft): string[] {
  const theme = draft.theme ?? "custom";
  const raw = byTheme[theme].map((s) => `${s.emoji} ${applyTemplate(s.title, draft.displayName)}`);
  return Array.from(new Set(raw)).slice(0, 10);
}
