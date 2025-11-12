export type RuleKey =
  | "noSpoil"
  | "anonReservations"
  | "budgetCap"
  | "priceRange"
  | "secondHandOk"
  | "handmadeOk"
  | "secretSanta"; // mode

export type Rule =
  | { key: "noSpoil" | "anonReservations" | "secondHandOk" | "handmadeOk" | "secretSanta" }
  | { key: "budgetCap"; value: number }
  | { key: "priceRange"; value: [number, number] };

export const RULES_CATALOG = {
  noSpoil: { label: "Cadeaux cachés dans ma liste", hint: "Je ne vois pas quels cadeaux de ma liste ont été réservés" },
  anonReservations: { label: "Réservations anonymes", hint: "On voit « réservé » sans le nom" },
  budgetCap: { label: "Budget maximum", hasValue: true },
  priceRange: { label: "Fourchette de prix", hasValue: true },
  secondHandOk: { label: "Seconde main acceptée" },
  handmadeOk: { label: "Fait main accepté" },
  secretSanta: { label: "Secret Santa" },
} satisfies Record<RuleKey, { label: string; hint?: string; hasValue?: boolean }>;

function isKnownRuleKey(k: string): k is RuleKey {
  return k in RULES_CATALOG;
}

function humanizeKey(k: string): string {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/** Formatage robuste (tolère les clés inconnues) */
export function formatRule(r: { key: string; value?: unknown }): string {
  if (r.key === "budgetCap" && typeof r.value === "number") {
    return `${RULES_CATALOG.budgetCap.label} ${r.value}€`;
  }
  if (r.key === "priceRange" && Array.isArray(r.value) && r.value.length === 2) {
    return `${RULES_CATALOG.priceRange.label} ${r.value[0]}–${r.value[1]}€`;
  }
  if (isKnownRuleKey(r.key)) {
    return RULES_CATALOG[r.key].label;
  }
  return humanizeKey(r.key);
}
