"use client";

import type { EventGiftMode } from "@prisma/client";
import { Gift, Sparkles } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  giftMode: EventGiftMode | null;
  secretSantaEnabled: boolean;
  onChangeGiftMode: (mode: EventGiftMode | null) => void;
  onChangeSecretSantaEnabled: (enabled: boolean) => void;
  disabled?: boolean;
};

export function GiftExchangeOptions({
  giftMode,
  secretSantaEnabled,
  onChangeGiftMode,
  onChangeSecretSantaEnabled,
  disabled = false,
}: Props) {
  return (
    <fieldset
      disabled={disabled}
      className="border-primary/20 bg-primary/5 space-y-3 rounded-2xl border p-4 sm:p-5"
    >
      <legend className="sr-only">Options de l&apos;échange de cadeaux</legend>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Votre échange de cadeaux</h3>
        <p className="text-muted-foreground text-sm">
          En famille, entre amis ou collègues, choisissez ce qui vous convient. Les deux options
          sont indépendantes.
        </p>
      </div>

      <label className="bg-card flex cursor-pointer items-start gap-3 rounded-xl border p-4">
        <Checkbox
          checked={secretSantaEnabled}
          disabled={disabled}
          onCheckedChange={(checked) => onChangeSecretSantaEnabled(checked === true)}
          className="mt-1"
        />
        <span className="min-w-0 space-y-1">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="text-primary h-4 w-4 shrink-0" aria-hidden />
            Secret Santa
          </span>
          <span className="text-muted-foreground block text-sm">
            Chacun offre un cadeau à une personne tirée au sort. Son attribution reste privée.
          </span>
        </span>
      </label>

      <label className="bg-card flex cursor-pointer items-start gap-3 rounded-xl border p-4">
        <Checkbox
          checked={giftMode === "PERSONAL_LISTS"}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onChangeGiftMode(checked === true ? "PERSONAL_LISTS" : null)
          }
          className="mt-1"
        />
        <span className="min-w-0 space-y-1">
          <span className="flex items-center gap-2 font-medium">
            <Gift className="text-primary h-4 w-4 shrink-0" aria-hidden />
            Une liste de cadeaux par personne
          </span>
          <span className="text-muted-foreground block text-sm">
            Chacun partage ses envies pour aider à choisir. Facultatif, avec ou sans tirage.
            {giftMode === "HOST_LIST" ? " Cette option remplacera la liste organisateur." : ""}
          </span>
        </span>
      </label>
    </fieldset>
  );
}
