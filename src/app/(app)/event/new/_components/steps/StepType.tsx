"use client";

import { Button } from "@/components/ui/button";
import { StepHeading } from "./StepHeading";
import { PartyPopper, Users, Dumbbell, Plane, Briefcase, Sparkles } from "lucide-react";

export type ThemeValue = "social" | "family" | "sport" | "trip" | "group" | "custom";

type Props = {
  value?: ThemeValue;
  onChange: (value: ThemeValue) => void;
  onNext?: () => void;
  autoAdvance?: boolean;
};

const THEMES: Array<{
  value: ThemeValue;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "social",
    title: "Social",
    description: "Anniversaire, soirée, fêtes…",
    Icon: PartyPopper,
  },
  {
    value: "family",
    title: "Famille",
    description: "Repas, week-end, cousinade…",
    Icon: Users,
  },
  {
    value: "sport",
    title: "Sport / activité",
    description: "Sortie, match, entraînement…",
    Icon: Dumbbell,
  },
  {
    value: "trip",
    title: "Voyage",
    description: "Week-end, vacances, road trip…",
    Icon: Plane,
  },
  {
    value: "group",
    title: "Groupe / asso",
    description: "Club, communauté, équipe…",
    Icon: Briefcase,
  },
  {
    value: "custom",
    title: "Sur-mesure",
    description: "Je configure moi-même.",
    Icon: Sparkles,
  },
];

export function StepType({ value, onChange, onNext, autoAdvance = false }: Props) {
  function pick(v: ThemeValue) {
    onChange(v);
    if (autoAdvance) onNext?.();
  }

  return (
    <div className="space-y-4">
      <StepHeading
        title="Pourquoi crées-tu cet événement ?"
        subtitle="Ça sert uniquement à personnaliser les suggestions. Tu peux changer plus tard."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        {THEMES.map(({ value: v, title, description, Icon }) => {
          const selected = value === v;

          return (
            <Button
              key={v}
              type="button"
              variant="secondary"
              onClick={() => pick(v)}
              className={[
                "h-auto items-start justify-start p-4 text-left",
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
                    "mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border",
                    selected ? "border-[var(--ring)]" : "border-[var(--border)]",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden={true} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="leading-tight font-medium">{title}</span>
                    {selected && (
                      <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--sidebar-primary)]">
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
