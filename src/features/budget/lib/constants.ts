type BudgetLineCategoryKey =
  | "VENUE"
  | "FOOD_BEVERAGE"
  | "DESIGN_DECORATION"
  | "ENTERTAINMENT"
  | "LOGISTICS"
  | "GUEST_EXPERIENCE"
  | "COMMUNICATION"
  | "MISCELLANEOUS";

type BudgetLineSourcingStatusKey = "DRAFT" | "SOURCING" | "QUOTES_RECEIVED" | "SELECTED" | "BOOKED";

type QuoteStatusKey = "AWAITING_RESPONSE" | "RECEIVED" | "SELECTED" | "REJECTED";

type PaymentEntryTypeKey = "DEPOSIT" | "BALANCE" | "OTHER";

type BudgetPaymentStatusKey =
  | "NOT_APPLICABLE"
  | "UNPAID"
  | "DEPOSIT_PAID"
  | "PARTIALLY_PAID"
  | "PAID";

export const BUDGET_DEFAULT_CURRENCY = "EUR" as const;

export const BUDGET_LOCAL_TAB_KEYS = ["summary", "lines", "quotes"] as const;

export const BUDGET_LINE_CATEGORY_OPTIONS = [
  "VENUE",
  "FOOD_BEVERAGE",
  "DESIGN_DECORATION",
  "ENTERTAINMENT",
  "LOGISTICS",
  "GUEST_EXPERIENCE",
  "COMMUNICATION",
  "MISCELLANEOUS",
] as const;

export const EDITABLE_BUDGET_LINE_SOURCING_STATUSES = ["DRAFT", "SOURCING"] as const;

export const BUDGET_LINE_CATEGORY_LABELS = {
  VENUE: "Lieu",
  FOOD_BEVERAGE: "Restauration",
  DESIGN_DECORATION: "Décoration",
  ENTERTAINMENT: "Animation",
  LOGISTICS: "Logistique",
  GUEST_EXPERIENCE: "Expérience invités",
  COMMUNICATION: "Communication",
  MISCELLANEOUS: "Divers",
} satisfies Record<BudgetLineCategoryKey, string>;

export const BUDGET_LINE_SOURCING_STATUS_LABELS = {
  DRAFT: "Brouillon",
  SOURCING: "Consultation",
  QUOTES_RECEIVED: "Devis reçus",
  SELECTED: "Retenu",
  BOOKED: "Réservé",
} satisfies Record<BudgetLineSourcingStatusKey, string>;

export const QUOTE_STATUS_LABELS = {
  AWAITING_RESPONSE: "En attente de réponse",
  RECEIVED: "Reçu",
  SELECTED: "Retenu",
  REJECTED: "Refusé",
} satisfies Record<QuoteStatusKey, string>;

export const PAYMENT_ENTRY_TYPE_LABELS = {
  DEPOSIT: "Acompte",
  BALANCE: "Solde",
  OTHER: "Autre",
} satisfies Record<PaymentEntryTypeKey, string>;

export const BUDGET_PAYMENT_STATUS_LABELS = {
  NOT_APPLICABLE: "Non applicable",
  UNPAID: "Non réglé",
  DEPOSIT_PAID: "Acompte réglé",
  PARTIALLY_PAID: "Partiellement réglé",
  PAID: "Réglé",
} satisfies Record<BudgetPaymentStatusKey, string>;

// Labels for dashboard financial metrics (committed amount = "Engagé", not "Retenu")
export const BUDGET_METRIC_LABELS = {
  totalBudget: "Budget global",
  estimated: "Estimé",
  committed: "Engagé",
  paid: "Réglé",
  remaining: "Reste à allouer",
} as const;

// Vendor/prestataire terminology — use "prestataire" throughout the UI
export const VENDOR_LABELS = {
  entity: "Prestataire",
  plural: "Prestataires",
  add: "Ajouter un prestataire",
  type: "Type de prestataire",
  name: "Nom du prestataire",
  contact: "Nom du contact",
  chooseExisting: "Choisir un prestataire existant",
  addNew: "Nouveau prestataire",
  noExisting: "Aucun prestataire disponible",
} as const;

// Empty states
export const BUDGET_EMPTY_STATE_LABELS = {
  noLines:
    "Votre budget est vide. Créez un premier poste pour commencer à organiser vos dépenses — lieu, traiteur, animation…",
  noReceivedQuotes: "Aucun devis reçu. Ajoutez un prestataire pour commencer la consultation.",
  noAwaitingQuotes:
    "Aucune demande de devis en cours. Contactez des prestataires pour obtenir des propositions.",
  noPayments: "Aucun paiement planifié. Ajoutez une échéance dès qu'une réservation est confirmée.",
  noQuotesOverall: "Aucun devis dans cette section.",
} as const;

// Tooltip / help text for form fields
export const BUDGET_TOOLTIP_LABELS = {
  targetAmount: "Montant maximal que vous souhaitez allouer à ce poste.",
  estimatedAmount: "Votre estimation actuelle, basée sur les devis reçus ou une première approximation.",
  internalNote: "Visible uniquement par les organisateurs. Non partagée avec le client.",
  depositType: "Acompte : versement partiel à la réservation. Solde : paiement final avant ou après l'événement.",
  validUntil: "Date d'expiration du devis indiquée par le prestataire. Passée cette date, le tarif n'est plus garanti.",
} as const;
