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
import { rejectQuote } from "@/features/budget/server/mutations/reject-quote";
import { selectQuote } from "@/features/budget/server/mutations/select-quote";
import type { QuoteSnapshot } from "@/features/budget/lib/types";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type Props = {
  eventSlug: string;
  budgetLineId: string;
  quote: QuoteSnapshot;
  allowSelect?: boolean;
  allowReject?: boolean;
  isSelected?: boolean;
};

export function QuoteDecisionActions(props: Props) {
  const [selectOpen, setSelectOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [decisionNote, setDecisionNote] = useState(props.quote.decisionNote ?? "");
  const [result, setResult] = useState<QuoteDecisionResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setDecisionNote(props.quote.decisionNote ?? "");
    setResult(null);
  }, [props.quote.id, props.quote.decisionNote, selectOpen, rejectOpen]);

  const runAction = (mode: "select" | "reject") => {
    startTransition(async () => {
      const action = mode === "select" ? selectQuote : rejectQuote;
      const nextResult = await action({
        eventSlug: props.eventSlug,
        budgetLineId: props.budgetLineId,
        quoteId: props.quote.id,
        decisionNote,
      });

      setResult(nextResult);
      if (nextResult.ok) {
        setSelectOpen(false);
        setRejectOpen(false);
      }
    });
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {props.allowSelect ? (
          <Button type="button" size="sm" onClick={() => setSelectOpen(true)} disabled={pending}>
            <CheckCircle2 className="h-4 w-4" />
            Retenir ce devis
          </Button>
        ) : null}
        {props.allowReject ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setRejectOpen(true)}
            disabled={pending}
          >
            <XCircle className="h-4 w-4" />
            Refuser ce devis
          </Button>
        ) : null}
      </div>

      <Dialog open={selectOpen} onOpenChange={setSelectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Retenir ce devis</DialogTitle>
            <DialogDescription>
              Ce devis deviendra la reference retenue pour cette ligne.
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
            <Button type="button" variant="outline" onClick={() => setSelectOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="button" onClick={() => runAction("select")} disabled={pending}>
              {pending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refuser ce devis</DialogTitle>
            <DialogDescription>
              Le devis restera visible dans l&apos;historique de cette ligne.
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
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="button" variant="outline" onClick={() => runAction("reject")} disabled={pending}>
              {pending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
