type SecretSantaOverviewBase = {
  membersCount: number;
  canManage: boolean;
  budgetCapCents: number | null;
};

export type SecretSantaOverview = SecretSantaOverviewBase &
  (
    | { state: "assigned"; recipientLabel: string }
    | { state: "waiting" | "not-assigned"; recipientLabel?: never }
  );

export function buildSecretSantaOverviewCard(summary: SecretSantaOverview) {
  if (summary.state === "assigned") {
    return {
      title: "Vous offrez un cadeau à",
      description: "Gardez la surprise jusqu'à l'échange des cadeaux !",
      action: "Voir le Secret Santa",
      badge: "Tirage effectué",
    };
  }

  if (summary.state === "not-assigned") {
    return {
      title: "Vous n'avez pas encore d'attribution",
      description: summary.canManage
        ? "Un tirage a déjà eu lieu. Vérifiez les participants dans Secret Santa avant de décider de la suite."
        : "Le tirage est effectué, mais aucune attribution ne vous est associée. Contactez l'organisateur pour la suite.",
      action: summary.canManage ? "Vérifier le Secret Santa" : "Voir le Secret Santa",
      badge: "À vérifier",
    };
  }

  if (summary.canManage) {
    return summary.membersCount < 2
      ? {
          title: "Invitez les participants avant le tirage",
          description:
            "Au moins deux participants inscrits sont nécessaires. Invitez votre groupe, puis préparez le tirage.",
          action: "Inviter des participants",
          badge: "Participants attendus",
        }
      : {
          title: "Votre Secret Santa attend son tirage",
          description:
            summary.budgetCapCents === null
              ? "Convenez d'un budget si besoin et vérifiez que votre groupe est au complet, puis lancez le tirage."
              : "Vérifiez que votre groupe est au complet, puis lancez le tirage. Chacun recevra son attribution en privé.",
          action: "Préparer le tirage",
          badge: "Tirage à lancer",
        };
  }

  return {
    title: "En attente du tirage",
    description:
      "L'organisateur n'a pas encore lancé le tirage. Votre attribution sera disponible ici dès qu'il sera effectué.",
    action: "Voir le Secret Santa",
    badge: "En attente",
  };
}
