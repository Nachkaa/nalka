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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VENDOR_LABELS } from "@/features/budget/lib/constants";
import type { QuoteMutationResult } from "@/features/budget/lib/sourcing-forms";
import { addSourcingVendor } from "@/features/budget/server/mutations/add-sourcing-vendor";
import { Plus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type Props = {
  eventSlug: string;
  budgetLineId: string;
  lineLabel: string;
  triggerLabel?: string;
};

export function AddSourcingVendorDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<QuoteMutationResult | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [vendorType, setVendorType] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requestedAt, setRequestedAt] = useState("");
  const [internalNote, setInternalNote] = useState("");

  useEffect(() => {
    if (open) {
      setVendorName("");
      setVendorType("");
      setContactName("");
      setEmail("");
      setPhone("");
      setRequestedAt("");
      setInternalNote("");
      setResult(null);
    }
  }, [open]);

  const handleSubmit = () => {
    startTransition(async () => {
      const nextResult = await addSourcingVendor({
        eventSlug: props.eventSlug,
        budgetLineId: props.budgetLineId,
        vendorName,
        vendorType,
        contactName,
        email,
        phone,
        requestedAt,
        internalNote,
      });
      setResult(nextResult);
      if (nextResult.ok) {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} disabled={pending}>
        <Plus className="h-4 w-4" />
        {props.triggerLabel ?? VENDOR_LABELS.add}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-2xl max-sm:top-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-none sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>{VENDOR_LABELS.add}</DialogTitle>
            <DialogDescription>
              Enregistrez un prestataire contacté pour {props.lineLabel}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`vendor-name-${props.budgetLineId}`}>
                {VENDOR_LABELS.name}{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id={`vendor-name-${props.budgetLineId}`}
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                aria-required="true"
              />
              {result?.fieldErrors?.vendorName ? <p className="text-sm text-red-600">{result.fieldErrors.vendorName}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`vendor-type-${props.budgetLineId}`}>{VENDOR_LABELS.type}</Label>
                <Input id={`vendor-type-${props.budgetLineId}`} value={vendorType} onChange={(e) => setVendorType(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`contact-name-${props.budgetLineId}`}>{VENDOR_LABELS.contact}</Label>
                <Input id={`contact-name-${props.budgetLineId}`} value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`email-${props.budgetLineId}`}>E-mail</Label>
                <Input id={`email-${props.budgetLineId}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {result?.fieldErrors?.email ? <p className="text-sm text-red-600">{result.fieldErrors.email}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`phone-${props.budgetLineId}`}>Téléphone</Label>
                <Input id={`phone-${props.budgetLineId}`} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`requested-at-${props.budgetLineId}`}>Contacté le</Label>
              <Input
                id={`requested-at-${props.budgetLineId}`}
                type="date"
                value={requestedAt}
                onChange={(e) => setRequestedAt(e.target.value)}
              />
              {result?.fieldErrors?.requestedAt ? <p className="text-sm text-red-600">{result.fieldErrors.requestedAt}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`note-${props.budgetLineId}`}>Note interne</Label>
              <Textarea id={`note-${props.budgetLineId}`} rows={4} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
            </div>

            {result?.formError ? <p className="text-sm text-red-600">{result.formError}</p> : null}
          </div>

          <DialogFooter className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              <span className="text-destructive">*</span> Champs obligatoires
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Annuler
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={pending}>
                {pending ? "Enregistrement…" : "Ajouter le prestataire"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
