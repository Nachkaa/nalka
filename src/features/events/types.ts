import type { EventMemberRole, EventRsvpStatus } from "@prisma/client";

export type EventSummary = {
  id: string;
  slug?: string | null;
  title: string;

  date: string | null; // YYYY-MM-DD
  dateLabel: string | null;
  time: string | null; // HH:mm
  location: string | null;
  locationLabel?: string | null;

  invitedCount: number;
  progress: number; // 0..100

  // source de vérité
  giftMode: "HOST_LIST" | "PERSONAL_LISTS";

  // dérivés UI (optionnels si tu préfères calculer à l’usage)
  isSecretSanta: boolean;
  hasGifts: boolean;
  hasDraw?: boolean;

  // Dashboard view extras
  imagePath?: string | null;
  userRole: EventMemberRole;
  rsvpStatus: EventRsvpStatus | null;
  rsvpRespondedAt: string | null;
  rsvpRequired: boolean;
};
