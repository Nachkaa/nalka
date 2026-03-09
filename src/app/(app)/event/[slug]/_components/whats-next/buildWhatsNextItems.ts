// src/app/(app)/event/[slug]/_components/whats-next/buildWhatsNextItems.ts

import {
  EventLocationMode,
  EventMemberRole,
  EventPollStatus,
  EventPollType,
  EventRsvpStatus,
  EventScheduleMode,
} from "@prisma/client";
import type { WhatsNextInput, WhatsNextItem } from "./types";

const MAX_ITEMS = 6;

const isAdminRole = (role: EventMemberRole) => role === "ADMIN" || role === "OWNER";

function pushOnce(out: WhatsNextItem[], item: WhatsNextItem) {
  if (out.some((x) => x.key === item.key)) return;
  out.push(item);
}

/**
 * Règle MVP:
 * - 1 item max pour DATE, 1 item max pour LIEU (pas de doublons “définir” + “ajouter options”)
 * - ordre stable (order)
 * - items limités à 6
 */
export function buildWhatsNextItems(input: WhatsNextInput): WhatsNextItem[] {
  const items: WhatsNextItem[] = [];
  const isAdmin = isAdminRole(input.role);

  // A) RSVP (participants)
  if (input.rsvpRequired && !isAdmin && input.myRsvpStatus === EventRsvpStatus.PENDING) {
    pushOnce(items, {
      key: "rsvp",
      order: 10,
      title: "Répondre à l’invitation",
      description: "Choisis Je viens / Peut-être / Je ne viens pas.",
      status: "todo",
      statusLabel: "En attente",
      icon: "rsvp",
      targetTab: "overview",
    });
  }

  // Helpers polls
  const polls = input.polls ?? [];
  const schedulePoll = polls.find(
    (p) => p.type === EventPollType.SCHEDULE && p.status === EventPollStatus.OPEN && p.isActive,
  );
  const locationPoll = polls.find(
    (p) => p.type === EventPollType.LOCATION && p.status === EventPollStatus.OPEN && p.isActive,
  );

  const scheduleOptionsCount = schedulePoll?.options?.length ?? 0;
  const locationOptionsCount = locationPoll?.options?.length ?? 0;

  // B) DATE (un seul item)
  if (input.canEditEvent) {
    const missingDate = input.scheduleMode === EventScheduleMode.TBD || !input.eventDate;

    if (schedulePoll) {
      if (scheduleOptionsCount < 2) {
        pushOnce(items, {
          key: "date-poll-add-options",
          order: 20,
          title: "Ajouter des options de date",
          description: "Ajoute 2–5 dates pour lancer les votes.",
          status: "todo",
          statusLabel: "Ouvert",
          icon: "date",
          targetTab: "overview", // tu es déjà dans l’overview où le PollCard est visible
          meta: { pollId: schedulePoll.id, pollType: "SCHEDULE" },
        });
      } else {
        pushOnce(items, {
          key: "date-poll-check",
          order: 20,
          title: "Finaliser la date",
          description: "Vérifie les votes et choisis la meilleure date.",
          status: "info",
          statusLabel: "Ouvert",
          icon: "date",
          targetTab: "overview",
          meta: { pollId: schedulePoll.id, pollType: "SCHEDULE" },
        });
      }
    } else if (missingDate) {
      pushOnce(items, {
        key: "date-define",
        order: 20,
        title: "Définir la date",
        description: "Fixe une date ou lance un sondage.",
        status: "todo",
        statusLabel: "À définir",
        icon: "date",
        targetTab: "timeline",
      });
    }
  }

  // C) LIEU (un seul item)
  if (input.canEditEvent) {
    const missingLocation = input.locationMode === EventLocationMode.TBD || !input.location?.trim();

    if (locationPoll) {
      if (locationOptionsCount < 2) {
        pushOnce(items, {
          key: "location-poll-add-options",
          order: 30,
          title: "Ajouter des options de lieu",
          description: "Ajoute 2–5 lieux pour lancer les votes.",
          status: "todo",
          statusLabel: "Ouvert",
          icon: "location",
          targetTab: "overview",
          meta: { pollId: locationPoll.id, pollType: "LOCATION" },
        });
      } else {
        pushOnce(items, {
          key: "location-poll-check",
          order: 30,
          title: "Finaliser le lieu",
          description: "Vérifie les votes et choisis le meilleur lieu.",
          status: "info",
          statusLabel: "Ouvert",
          icon: "location",
          targetTab: "overview",
          meta: { pollId: locationPoll.id, pollType: "LOCATION" },
        });
      }
    } else if (missingLocation) {
      pushOnce(items, {
        key: "location-define",
        order: 30,
        title: "Définir le lieu",
        description: "Ajoute une adresse ou lance un sondage.",
        status: "todo",
        statusLabel: "À définir",
        icon: "location",
        targetTab: "overview",
      });
    }
  }

  // D) Description (optionnel, organisateur)
  if (input.canEditEvent) {
    const missingDescription = !input.description?.trim();
    if (missingDescription) {
      pushOnce(items, {
        key: "description",
        order: 40,
        title: "Ajouter une description",
        description: "Quelques lignes pour clarifier l’événement.",
        status: "info",
        statusLabel: "Optionnel",
        icon: "description",
        targetTab: "overview",
      });
    }
  }

  // E) Gifts
  if (input.modules.gifts && input.giftsStats) {
    const hasPersonalList = input.giftMode === "PERSONAL_LISTS";

    if (hasPersonalList && input.giftsStats.myItemsCount === 0) {
      pushOnce(items, {
        key: "gifts-add",
        order: 60,
        title: "Ajouter des idées de cadeaux",
        description: "Crée ta liste pour que les autres puissent réserver.",
        status: "todo",
        statusLabel: "À faire",
        icon: "gifts",
        targetTab: "gifts",
      });
    }

    if (input.giftsStats.otherItemsCount > 0 && input.giftsStats.myReservationsCount === 0) {
      pushOnce(items, {
        key: "gifts-reserve",
        order: 70,
        title: "Réserver un cadeau",
        description: "Choisis un cadeau à offrir parmi les listes.",
        status: "info",
        statusLabel: "Ouvert",
        icon: "gifts",
        targetTab: "gifts",
      });
    }
  }

  // F) Potluck
  if (
    input.modules.potluck &&
    input.potluckStats &&
    input.potluckStats.totalItems > 0 &&
    input.potluckStats.myClaims === 0
  ) {
    pushOnce(items, {
      key: "potluck-claim",
      order: 80,
      title: "Choisir ce que tu ramènes",
      description: "Réserve un item pour le potluck.",
      status: "todo",
      statusLabel: "En attente",
      icon: "potluck",
      targetTab: "potluck",
    });
  }

  return items.sort((a, b) => a.order - b.order).slice(0, MAX_ITEMS);
}
