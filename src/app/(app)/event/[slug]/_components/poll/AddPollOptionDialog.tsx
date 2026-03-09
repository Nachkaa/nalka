// app/(app)/event/[slug]/_components/AddPollOptionDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import { DatePickerISO } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EventPollType } from "@prisma/client";
import { useMemo, useState, useTransition } from "react";
import { addPollOption } from "../../actions/polls";

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
  const [dateValue, setDateValue] = useState<string>("");

  const isSchedule = pollType === EventPollType.SCHEDULE;

  const canSubmit = useMemo(() => {
    const ok = isSchedule ? !!dateValue.trim() : !!textValue.trim();
    return ok && !isPending;
  }, [isSchedule, dateValue, textValue, isPending]);

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
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setError(null);
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
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Ex: Le Bistro d’Antoine, Nice…"
                required
              />
            )}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button className="w-full" onClick={onSubmit} disabled={!canSubmit}>
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
