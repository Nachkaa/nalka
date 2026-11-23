"use client";

import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Handshake,
  Sparkles,
  TreePine,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { StepHeading } from "./StepHeading";

export type ThemeValue = "social" | "family" | "sport" | "trip" | "group" | "custom" | "christmas";

type Props = {
  value?: ThemeValue;
  onChange: (value: ThemeValue) => void;
  onNext?: () => void;
  autoAdvance?: boolean;
  christmasSeason?: boolean;
};

const THEMES: Array<{
  value: ThemeValue;
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    value: "christmas",
    title: "Noël / Secret Santa",
    description: "Un échange de cadeaux en famille, entre amis ou collègues.",
    Icon: TreePine,
  },
  {
    value: "social",
    title: "Séminaire",
    description: "Équipe, client, formation, conférence...",
    Icon: BriefcaseBusiness,
  },
  {
    value: "family",
    title: "Événement client",
    description: "Réception, atelier, rendez-vous invité...",
    Icon: Handshake,
  },
  {
    value: "sport",
    title: "Soirée partenaire",
    description: "Cocktail, networking, activation marque...",
    Icon: Building2,
  },
  {
    value: "trip",
    title: "Offsite interne",
    description: "Déplacement, séjour, journée d'équipe...",
    Icon: Users,
  },
  {
    value: "group",
    title: "Association / groupe",
    description: "Club, communauté, équipe projet...",
    Icon: BadgeCheck,
  },
  {
    value: "custom",
    title: "Sur-mesure",
    description: "Je configure moi-même.",
    Icon: Sparkles,
  },
];

export function StepType({
  value,
  onChange,
  onNext,
  autoAdvance = false,
  christmasSeason = false,
}: Props) {
  function pick(v: ThemeValue) {
    onChange(v);
    if (autoAdvance) onNext?.();
  }

  return (
    <div className="space-y-4">
      <StepHeading
        title="Quel type d'événement organisez-vous ?"
        subtitle="Ce choix sert uniquement à personnaliser les suggestions. Vous pourrez ajuster les modules ensuite."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        {THEMES.map(({ value: v, title, description, Icon }) => {
          const selected = value === v;

          return (
            <Button
              key={`${v}-${title}`}
              type="button"
              variant="secondary"
              aria-pressed={selected}
              onClick={() => pick(v)}
              className={[
                "h-auto items-start justify-start p-4 text-left whitespace-normal",
                "rounded-2xl border bg-[var(--card)] hover:bg-[var(--card)]/80",
                "transition-colors",
                selected
                  ? "border-[var(--ring)] ring-2 ring-[var(--ring)]"
                  : "border-[var(--border)]",
              ].join(" ")}
            >
              <div className="flex w-full items-start gap-3">
                <div
                  className={[
                    "text-primary mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-primary/30 bg-primary/10" : "border-primary/15 bg-primary/5",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="leading-tight font-medium">{title}</span>
                    {v === "christmas" && christmasSeason && !selected ? (
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
                        C&apos;est la saison
                      </span>
                    ) : null}
                    {selected && (
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
                        Sélectionné
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground mt-1 text-xs leading-snug">{description}</p>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
