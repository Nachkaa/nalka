export type ReleaseNoteSectionKey = "new" | "improved" | "fixed";

export type ReleaseNote = {
  slug: string;
  month: string;
  year: number;
  dateLabel: string;
  title: string;
  summary: string;
  featured: boolean;
  heroImage: string;
  tags: string[];
  sections: Record<ReleaseNoteSectionKey, string[]>;
};

export const DEFAULT_RELEASE_NOTE_IMAGE = "/images/release-notes/default-release-note.webp";

export const releaseNotes: ReleaseNote[] = [
  {
    slug: "avril-2026-programme-et-creation-plus-clairs",
    month: "Avril",
    year: 2026,
    dateLabel: "9 avril 2026",
    title: "Le programme arrive dans Nalka",
    summary:
      "Vous pouvez maintenant ajouter les temps forts d’un événement et les partager simplement avec vos invités.",
    featured: true,
    heroImage: "/images/release-notes/release-programme.webp",
    tags: ["Programme", "Création", "Modules"],
    sections: {
      new: [
        "Un module Programme permet d’ajouter les différents moments d’un événement.",
        "Les invités peuvent consulter le programme sans pouvoir le modifier.",
        "Le module Programme peut être activé dès la création de l’événement.",
      ],
      improved: [
        "Le choix des modules pendant la création est plus clair.",
        "Le gestionnaire de modules est plus simple à comprendre sur mobile.",
      ],
      fixed: [
        "Les derniers détails visuels et techniques autour de Programme ont été corrigés avant mise en ligne.",
        "Les badges de date et de lieu sont maintenant cohérents dans l’en-tête de l’événement.",
      ],
    },
  },
  {
    slug: "mars-2026-auth-et-invitations-plus-fluides",
    month: "Mars",
    year: 2026,
    dateLabel: "23 mars 2026",
    title: "Se connecter et rejoindre un événement devient plus simple",
    summary:
      "On a retiré plusieurs frictions autour de la connexion et de l’accès aux événements privés.",
    featured: false,
    heroImage: "/images/release-notes/release-auth-invitations.webp",
    tags: ["Connexion", "Invitations", "Confidentialité"],
    sections: {
      new: [],
      improved: [
        "La connexion Google fonctionne mieux pour les comptes déjà existants.",
        "Le parcours entre page publique, connexion et espace événement est plus direct.",
        "Le header et la navigation réagissent plus proprement quand on est connecté.",
      ],
      fixed: [
        "Plusieurs soucis autour des invitations et du routage authentifié ont été corrigés.",
        "Le lien entre session, profil et événement partagé est plus fiable.",
      ],
    },
  },
  {
    slug: "mars-2026-sondages-et-flux-evenement-stabilises",
    month: "Mars",
    year: 2026,
    dateLabel: "9 mars 2026",
    title: "Les sondages arrivent dans les événements",
    summary:
      "Nalka gère maintenant les sondages de date et repose sur une base plus stable côté création et édition.",
    featured: false,
    heroImage: "/images/release-notes/release-polls.webp",
    tags: ["Sondages", "Stabilité", "Événements"],
    sections: {
      new: [
        "Les sondages d’événement sont maintenant pris en charge.",
      ],
      improved: [
        "La création et l’édition d’un événement reposent sur une structure plus propre.",
        "Les flux côté actions serveur sont plus lisibles et plus robustes.",
      ],
      fixed: [
        "Plusieurs incohérences techniques autour des fichiers et des actions ont été corrigées.",
      ],
    },
  },
  {
    slug: "decembre-2025-secret-santa-et-listes-participants",
    month: "Décembre",
    year: 2025,
    dateLabel: "8 décembre 2025",
    title: "Secret Santa devient plus clair à organiser",
    summary:
      "Le tirage, les participants et les invitations fonctionnent de façon plus simple et plus compréhensible.",
    featured: false,
    heroImage: "/images/release-notes/release-secret-santa.webp",
    tags: ["Secret Santa", "Participants", "Invitations"],
    sections: {
      new: [
        "Le tirage Secret Santa s’appuie maintenant sur les vrais participants de l’événement.",
        "Des emails accompagnent les attributions Secret Santa.",
      ],
      improved: [
        "Les listes cadeaux sont mieux séparées de la simple appartenance à un événement.",
        "Les écrans et états de chargement liés à Secret Santa sont plus clairs.",
      ],
      fixed: [
        "Le comportement d’invitation et de jonction à l’événement a été corrigé.",
        "La création automatique des listes est plus cohérente.",
      ],
    },
  },
  {
    slug: "novembre-2025-listes-cadeaux-plus-pratiques",
    month: "Novembre",
    year: 2025,
    dateLabel: "22 novembre 2025",
    title: "Les listes cadeaux deviennent plus faciles à utiliser",
    summary:
      "Plusieurs changements rendent les listes cadeaux plus simples à remplir, modifier et utiliser au quotidien.",
    featured: false,
    heroImage: "/images/release-notes/release-gift-lists.webp",
    tags: ["Cadeaux", "Mobile", "UX"],
    sections: {
      new: [
        "Une image peut être récupérée automatiquement depuis un lien partagé.",
        "Le profil utilisateur peut être mis à jour directement dans l’application.",
      ],
      improved: [
        "Le formulaire cadeau gère mieux les aperçus et les erreurs.",
        "L’expérience mobile autour des listes et des suppressions est plus confortable.",
      ],
      fixed: [
        "Le fonctionnement des listes finalisées a été simplifié.",
        "Plusieurs actions d’édition, de suppression et d’affichage ont été nettoyées.",
      ],
    },
  },
  {
    slug: "novembre-2025-evenements-et-cadeaux-mieux-structures",
    month: "Novembre",
    year: 2025,
    dateLabel: "15 novembre 2025",
    title: "Les bases de Nalka sont en place",
    summary:
      "Cette première étape pose le socle des événements, des listes cadeaux et des règles de confidentialité.",
    featured: false,
    heroImage: "/images/release-notes/release-foundations.webp",
    tags: ["Événement", "Cadeaux", "Confidentialité"],
    sections: {
      new: [
        "Chaque événement peut activer ou non les cadeaux.",
        "Les cadeaux distinguent une liste unique, une liste par personne et Secret Santa.",
        "Les premières règles de confidentialité et de réservation sont posées.",
      ],
      improved: [],
      fixed: [],
    },
  },
] satisfies ReleaseNote[];
