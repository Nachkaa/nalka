"use client";

import { Button } from "@/components/ui/button";
import { DatePickerISO } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EventPollType } from "@prisma/client";
import { useMemo, useState, useTransition } from "react";

import { addPollOption } from "../server/mutations";

export function AddPollOptionDialog({
  open,
  onOpenChange,
  slug,
  pollId,
  pollType,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slug: string;
  pollId: string;
  pollType: EventPollType;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [dateValue, setDateValue] = useState("");

  const isSchedule = pollType === EventPollType.SCHEDULE;

  const canSubmit = useMemo(() => {
    const valid = isSchedule ? !!dateValue.trim() : !!textValue.trim();
    return valid && !isPending;
  }, [dateValue, isPending, isSchedule, textValue]);

  const onSubmit = () => {
    setError(null);

    startTransition(async () => {
      try {
        if (isSchedule) {
          await addPollOption({ slug, pollId, dateValue });
          setDateValue("");
        } else {
          await addPollOption({ slug, pollId, textValue });
          setTextValue("");
        }
        onOpenChange(false);
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "Erreur.");
      }
    });
  };

  const title = isSchedule ? "Ajouter une date" : "Ajouter un lieu";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setError(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{isSchedule ? "Date" : "Intitulé"}</label>

            {isSchedule ? (
              <DatePickerISO
                value={dateValue}
                onChange={(iso) => setDateValue(iso ?? "")}
                placeholder="Sélectionner une date"
                disabled={isPending}
                disablePast
                autoOpen={open}
              />
            ) : (
              <Input
                value={textValue}
                onChange={(event) => setTextValue(event.target.value)}
                placeholder="Ex: Le Bistro d’Antoine, Nice…"
                required
              />
            )}
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <Button className="w-full" onClick={onSubmit} disabled={!canSubmit}>
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
