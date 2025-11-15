export type EventSummary = {
  id: string;
  slug?: string | null;
  title: string;

  date: string | null;        // YYYY-MM-DD
  dateLabel: string | null;
  location: string | null;

  invitedCount: number;       // all memberships
  progress: number;           // 0..100, coverage of others I've reserved for

  // nouveau modèle
  hasGifts?: boolean;
  giftMode?: "HOST_LIST" | "SECRET_SANTA" | "PERSONAL_LISTS";

  // compat / UI
  isSecretSanta?: boolean;    // dérivé de giftMode === "SECRET_SANTA"
  hasDraw?: boolean;
};
