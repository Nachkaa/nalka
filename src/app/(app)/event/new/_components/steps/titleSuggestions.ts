import type { Draft } from "../EventCreateStepper";

type Theme = Draft["theme"];

type Suggestion = { prefix: string; title: string };

const byTheme: Record<Exclude<Theme, undefined>, Suggestion[]> = {
  social: [
    { prefix: "Séminaire", title: "Séminaire équipe" },
    { prefix: "Formation", title: "Formation client" },
    { prefix: "Conférence", title: "Conférence interne" },
    { prefix: "Atelier", title: "Atelier de travail" },
  ],
  family: [
    { prefix: "Client", title: "Événement client" },
    { prefix: "Réception", title: "Réception client" },
    { prefix: "Atelier", title: "Atelier client" },
    { prefix: "Brief", title: "Rendez-vous projet" },
  ],
  sport: [
    { prefix: "Partenaires", title: "Soirée partenaires" },
    { prefix: "Networking", title: "Cocktail networking" },
    { prefix: "Activation", title: "Activation partenaire" },
    { prefix: "Relations", title: "Rencontre partenaires" },
  ],
  trip: [
    { prefix: "Offsite", title: "Offsite interne" },
    { prefix: "Équipe", title: "Journée équipe" },
    { prefix: "Séjour", title: "Séjour d'équipe" },
    { prefix: "Retraite", title: "Retraite projet" },
  ],
  group: [
    { prefix: "Association", title: "Événement association" },
    { prefix: "Communauté", title: "Rencontre communauté" },
    { prefix: "Club", title: "Événement du club" },
    { prefix: "Équipe", title: "Session équipe projet" },
  ],
  custom: [
    { prefix: "Lancement", title: "Lancement produit" },
    { prefix: "Pilotage", title: "Événement professionnel" },
    { prefix: "Projet", title: "Comité événement" },
    { prefix: "Opérations", title: "Espace opérations" },
  ],
};

function applyTemplate(value: string, name: string) {
  const safeName = (name || "").trim();
  return safeName ? `${value} - ${safeName}` : value;
}

export function getTitleSuggestions(draft: Draft): string[] {
  const theme = draft.theme ?? "custom";
  const raw = byTheme[theme].map((suggestion) =>
    applyTemplate(suggestion.title, suggestion.prefix === "Projet" ? draft.displayName : ""),
  );
  return Array.from(new Set(raw)).slice(0, 10);
}
