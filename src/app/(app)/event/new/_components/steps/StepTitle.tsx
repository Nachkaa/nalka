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
          title="Donne un nom à l’événement"
          subtitle="Simple et reconnaissable. Tu pourras le modifier après."
        />
        <Input
          id="title"
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex: Week-end famille Soyez"
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
          placeholder="Quelques infos utiles…"
        />
        <p className="text-muted-foreground text-xs">
          Mets ici les infos utiles (dress code, programme, lien, etc.). La date et le lieu viennent
          après.
        </p>
      </div>
    </div>
  );
}
