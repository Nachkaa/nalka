"use client";

import { Button } from "@/components/ui/button";
import { DatePickerISO } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatIsoToFrenchDayMonth } from "@/lib/dates/format-date";
import { cn } from "@/lib/utils";
import { EventPollType } from "@prisma/client";
import { Check } from "lucide-react";
import { useState } from "react";

import { votersLabel } from "../lib/poll-utils";
import type { EventPollVM } from "../types";

export function DecidePollOptionDialog({
  poll,
  meId,
  open,
  onOpenChange,
  isPending,
  recommendedOptionId,
  isRecommendationStrong,
  selectedOptionId,
  setSelectedOptionId,
  onApplyDecision,
  onApplyManual,
  currentFinalValue,
}: {
  poll: EventPollVM;
  meId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isPending: boolean;
  recommendedOptionId: string | null;
  isRecommendationStrong: boolean;
  selectedOptionId: string | null;
  setSelectedOptionId: (id: string | null) => void;
  onApplyDecision: () => void;
  onApplyManual: (value: string) => void;
  currentFinalValue?: string | null;
}) {
  const hasOptions = (poll.options?.length ?? 0) > 0;
  const isLocation = poll.type === EventPollType.LOCATION;
  const currentLabel = isLocation ? "Lieu actuel" : "Date actuelle";
  const dialogKey = `${poll.id}-${open ? "open" : "closed"}`;
  const [manualValue, setManualValue] = useState("");

  const hasManual = manualValue.trim().length > 0;
  const hasPollSelection = !!selectedOptionId;
  const canSubmit = !isPending && (hasManual || hasPollSelection);

  const handleSubmit = () => {
    if (hasManual) return onApplyManual(manualValue.trim());
    return onApplyDecision();
  };

  const renderOptionLabel = (label: string) => {
    if (poll.type !== EventPollType.SCHEDULE) return label;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(label)) return label;
    return formatIsoToFrenchDayMonth(label);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={dialogKey}>
        <DialogHeader>
          <DialogTitle>{isLocation ? "Gérer le sondage - Lieu" : "Gérer le sondage - Date"}</DialogTitle>
        </DialogHeader>

        {currentFinalValue ? (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide">Sondage en cours</div>
            <span className="text-muted-foreground">{currentLabel}: </span>
            <span className="font-medium">{currentFinalValue}</span>
          </div>
        ) : null}

        {!hasOptions ? (
          <div className="text-muted-foreground rounded-lg border border-dashed text-sm">
            Ce sondage est vide. Ajoute au moins une option pour pouvoir choisir via le sondage.
          </div>
        ) : null}

        {hasOptions ? (
          <div className="space-y-2">
            {poll.options.map((option) => {
              const active = selectedOptionId === option.id;
              const recommended = option.id === recommendedOptionId;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedOptionId(option.id);
                    setManualValue("");
                  }}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                    "hover:bg-muted/40 active:bg-muted/60",
                    active &&
                      "border-[var(--primary)] bg-[color-mix(in_oklch,var(--primary),white_92%)]",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{renderOptionLabel(option.label)}</span>

                      {recommended ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium",
                            isRecommendationStrong
                              ? "bg-[color-mix(in_oklch,var(--primary),white_85%)] text-(--primary)"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          Recommandé
                        </span>
                      ) : null}

                      {option.count > 0 ? (
                        <span className="inline-flex items-center rounded-sm bg-[var(--accent)]/40 px-2 py-0.5 text-[10px] font-medium">
                          {option.count} vote{option.count > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>

                    {option.voters?.length ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {votersLabel(option.voters, meId, 4)}
                      </p>
                    ) : null}
                  </div>

                  {active ? <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="pt-4">
          <div className="my-3 flex items-center gap-3">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              ou
            </span>
            <div className="bg-border h-px flex-1" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              {isLocation ? "Renseigner un lieu directement" : "Renseigner une date directement"}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {isLocation ? (
                <Input
                  value={manualValue}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualValue(value);
                    if (value.trim().length > 0) setSelectedOptionId(null);
                  }}
                  placeholder="Ex: Chez Juliette / Restaurant X / En ligne..."
                  disabled={isPending}
                  className="sm:flex-1"
                />
              ) : (
                <DatePickerISO
                  value={manualValue}
                  onChange={(iso) => {
                    const value = iso ?? "";
                    setManualValue(value);
                    if (value.trim().length > 0) setSelectedOptionId(null);
                  }}
                  placeholder="Sélectionner une date"
                  disabled={isPending}
                  disablePast
                  autoOpen={false}
                  displayFormat="EEEE d MMMM"
                />
              )}
            </div>

            <p className="text-muted-foreground text-xs">Le sondage sera clôturé automatiquement.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            Définir et fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
