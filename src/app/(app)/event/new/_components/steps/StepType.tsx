"use client";

import {
  BadgeCheck,
  Bike,
  Heart,
  PartyPopper,
  Sparkles,
  TreePine,
  Luggage,
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
    description: "Cadeaux et retrouvailles en famille ou entre amis.",
    Icon: TreePine,
  },
  {
    value: "social",
    title: "Entre amis",
    description: "Anniversaire, soirée, dîner, barbecue…",
    Icon: PartyPopper,
  },
  {
    value: "family",
    title: "En famille",
    description: "Repas, anniversaire, fête de famille…",
    Icon: Heart,
  },
  {
    value: "sport",
    title: "Sport et sorties",
    description: "Randonnée, tournoi, sortie à vélo…",
    Icon: Bike,
  },
  {
    value: "trip",
    title: "Week-end et vacances",
    description: "Séjour au ski, escapade, vacances à plusieurs…",
    Icon: Luggage,
  },
  {
    value: "group",
    title: "Association / groupe",
    description: "Club, association, retrouvailles de groupe…",
    Icon: BadgeCheck,
  },
  {
    value: "custom",
    title: "Autre occasion",
    description: "Votre idée, votre façon de vous retrouver.",
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
        subtitle="Choisissez l'occasion. Vous pourrez ensuite ajouter les options qui vous sont utiles."
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
