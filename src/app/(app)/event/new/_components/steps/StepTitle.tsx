"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getTitleSuggestions } from "./titleSuggestions";
import type { Draft } from "../EventCreateStepper";
import { StepHeading } from "./StepHeading";

type Props = {
  draft: Draft;
  onChange: (patch: { title?: string; description?: string }) => void;
  onNext?: () => void;
  autoAdvance?: boolean;
};

export function StepTitle({ draft, onChange, onNext, autoAdvance = false }: Props) {
  const suggestions = getTitleSuggestions(draft);

  function pickTitle(t: string) {
    onChange({ title: t });
    if (autoAdvance) onNext?.();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <StepHeading
          title="Nommez l'événement"
          subtitle="Choisissez un nom simple et reconnaissable. Vous pourrez le modifier plus tard."
        />
        <Input
          id="title"
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex. Séminaire équipe - Q3"
          autoFocus
        />

        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Button
              key={s}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => pickTitle(s)}
              className="h-8 rounded-full px-3 text-xs"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Description (optionnel)</Label>
        <Textarea
          id="desc"
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Objectif, format, informations utiles aux participants..."
        />
        <p className="text-muted-foreground text-xs">
          Indiquez les informations utiles aux participants. La date et le lieu viennent ensuite.
        </p>
      </div>
    </div>
  );
}
