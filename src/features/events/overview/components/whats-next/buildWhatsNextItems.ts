import { EventGiftMode, EventPollStatus, EventPollType, EventRsvpStatus } from "@prisma/client";

import type { WhatsNextInput, WhatsNextItem } from "./types";

const isAdminRole = (role: WhatsNextInput["role"]) => role === "ADMIN" || role === "OWNER";

export function buildWhatsNextItems(input: WhatsNextInput): WhatsNextItem[] {
  const items: WhatsNextItem[] = [];
  const canEdit = input.canEditEvent;
  const isAdmin = isAdminRole(input.role);

  if (input.rsvpRequired && !isAdmin && input.myRsvpStatus === EventRsvpStatus.PENDING) {
    items.push({
      key: "rsvp",
      order: 0,
      title: "Répondre à l'invitation",
      description: "Indique si tu viens pour aider l'organisateur à compter les participants.",
      status: "todo",
      statusLabel: "À faire",
      icon: "rsvp",
    });
  }

  if (!input.eventDate) {
    items.push({
      key: "date",
      order: 10,
      title: canEdit ? "Fixer la date" : "Date en attente",
      description: canEdit
        ? "Choisis une date définitive ou lance un sondage si besoin."
        : "L'organisateur doit encore confirmer la date.",
      status: canEdit ? "todo" : "info",
      statusLabel: canEdit ? "À faire" : "En attente",
      icon: "date",
      targetTab: "overview",
    });
  }

  if (!input.location) {
    items.push({
      key: "location",
      order: 20,
      title: canEdit ? "Définir le lieu" : "Lieu en attente",
      description: canEdit
        ? "Renseigne un lieu précis ou lance un sondage pour trancher."
        : "Le lieu sera partagé dès qu'il sera confirmé.",
      status: canEdit ? "todo" : "info",
      statusLabel: canEdit ? "À faire" : "En attente",
      icon: "location",
      targetTab: "overview",
    });
  }

  if (canEdit && !input.description) {
    items.push({
      key: "description",
      order: 30,
      title: "Ajouter quelques détails",
      description: "Explique l'ambiance, le plan ou les infos utiles pour les invités.",
      status: "todo",
      statusLabel: "Conseillé",
      icon: "description",
      targetTab: "overview",
    });
  }

  const openPolls = input.polls.filter(
    (poll) => poll.status === EventPollStatus.OPEN && poll.isActive,
  );

  if (openPolls.length > 0) {
    const schedulePoll = openPolls.find((poll) => poll.type === EventPollType.SCHEDULE);
    const locationPoll = openPolls.find((poll) => poll.type === EventPollType.LOCATION);

    if (schedulePoll) {
      items.push({
        key: "schedule-poll",
        order: 40,
        title: canEdit ? "Suivre le sondage de date" : "Voter pour la date",
        description: canEdit
          ? "Consulte les réponses pour pouvoir fixer la meilleure date."
          : "Donne tes disponibilités pour aider à choisir.",
        status: "info",
        statusLabel: canEdit ? `${schedulePoll.options.length} options` : "Sondage ouvert",
        icon: "poll",
        targetTab: "polls",
        meta: { pollId: schedulePoll.id, pollType: schedulePoll.type },
      });
    }

    if (locationPoll) {
      items.push({
        key: "location-poll",
        order: 41,
        title: canEdit ? "Suivre le sondage de lieu" : "Voter pour le lieu",
        description: canEdit
          ? "Compare les propositions avant de confirmer le lieu."
          : "Choisis l'endroit qui te convient le mieux.",
        status: "info",
        statusLabel: canEdit ? `${locationPoll.options.length} options` : "Sondage ouvert",
        icon: "poll",
        targetTab: "polls",
        meta: { pollId: locationPoll.id, pollType: locationPoll.type },
      });
    }
  }

  if (input.modules.gifts && input.giftMode === EventGiftMode.PERSONAL_LISTS) {
    const myItemsCount = input.giftsStats?.myItemsCount ?? 0;
    if (myItemsCount === 0) {
      items.push({
        key: "gifts",
        order: 50,
        title: "Compléter ta liste cadeaux",
        description: "Ajoute quelques idées pour aider les autres à choisir sans se tromper.",
        status: "todo",
        statusLabel: "Liste vide",
        icon: "gifts",
        targetTab: "gifts",
      });
    }
  }

  if (input.modules.potluck) {
    const myClaims = input.potluckStats?.myClaims ?? 0;
    if (myClaims === 0) {
      items.push({
        key: "potluck",
        order: 60,
        title: "Choisir quoi apporter",
        description: "Réserve un plat, une boisson ou du matériel pour éviter les doublons.",
        status: "todo",
        statusLabel: "À choisir",
        icon: "potluck",
        targetTab: "potluck",
      });
    }
  }

  if (input.modules.expenses) {
    items.push({
      key: "expenses",
      order: 70,
      title: "Suivre le budget",
      description: "Consulte les dépenses prévues et garde un œil sur les frais à venir.",
      status: "info",
      statusLabel: "Budget",
      icon: "expenses",
      targetTab: "budget",
    });
  }

  return items.sort((a, b) => a.order - b.order);
}
