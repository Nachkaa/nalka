export type EventSummary = {
  id: string;
  slug?: string | null;
  title: string;
  date: string | null;       // YYYY-MM-DD
  location: string | null;
  invitedCount: number;      // all memberships
  dateLabel: string | null;
  progress: number;          // 0..100, coverage of others I've reserved for
  isSecretSanta?: boolean;
  hasDraw?: boolean;
};