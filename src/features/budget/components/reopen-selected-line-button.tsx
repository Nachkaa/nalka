"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { QuoteDecisionResult } from "@/features/budget/lib/quote-decision-form";
import { reopenSelectedLine } from "@/features/budget/server/mutations/reopen-selected-line";
import { RotateCcw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type Props = {
  eventSlug: string;
  budgetLineId: string;
  selectedQuoteId: string;
  lineLabel: string;
};

export function ReopenSelectedLineButton(props: Props) {
  const [open, setOpen] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const [result, setResult] = useState<QuoteDecisionResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setDecisionNote("");
      setResult(null);
    }
  }, [open]);

  const handleSubmit = () => {
    startTransition(async () => {
      const nextResult = await reopenSelectedLine({
        eventSlug: props.eventSlug,
        budgetLineId: props.budgetLineId,
        quoteId: props.selectedQuoteId,
        decisionNote,
      });

      setResult(nextResult);
      if (nextResult.ok) {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} disabled={pending}>
        <RotateCcw className="h-4 w-4" />
        Rouvrir l&apos;evaluation
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rouvrir l&apos;evaluation</DialogTitle>
            <DialogDescription>
              Remettez {props.lineLabel} en comparaison si vous souhaitez revoir les devis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              rows={4}
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder="Note optionnelle"
            />
            {result?.formError ? <p className="text-sm text-red-600">{result.formError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="button" variant="outline" onClick={handleSubmit} disabled={pending}>
              {pending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
