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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VENDOR_LABELS } from "@/features/budget/lib/constants";
import type { QuoteMutationResult } from "@/features/budget/lib/sourcing-forms";
import type { VendorOption } from "@/features/budget/lib/types";
import { addReceivedQuote } from "@/features/budget/server/mutations/add-received-quote";
import { ReceiptText } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type Props = {
  eventSlug: string;
  budgetLineId: string;
  lineLabel: string;
  vendors: VendorOption[];
  triggerLabel?: string;
};

export function AddReceivedQuoteDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<QuoteMutationResult | null>(null);
  const [vendorMode, setVendorMode] = useState<"existing" | "new">("existing");
  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorType, setVendorType] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [scope, setScope] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [internalNote, setInternalNote] = useState("");

  useEffect(() => {
    if (open) {
      setVendorMode(props.vendors.length > 0 ? "existing" : "new");
      setVendorId("");
      setVendorName("");
      setVendorType("");
      setContactName("");
      setEmail("");
      setPhone("");
      setAmount("");
      setScope("");
      setReceivedAt("");
      setValidUntil("");
      setInternalNote("");
      setResult(null);
    }
  }, [open, props.vendors.length]);

  const handleSubmit = () => {
    startTransition(async () => {
      const nextResult = await addReceivedQuote({
        eventSlug: props.eventSlug,
        budgetLineId: props.budgetLineId,
        vendorId: vendorMode === "existing" ? vendorId : "",
        vendorName: vendorMode === "new" ? vendorName : "",
        vendorType,
        contactName,
        email,
        phone,
        amount,
        scope,
        receivedAt,
        validUntil,
        internalNote,
      });
      setResult(nextResult);
      if (nextResult.ok) setOpen(false);
    });
  };

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)} disabled={pending}>
        <ReceiptText className="h-4 w-4" />
        {props.triggerLabel ?? "Ajouter un devis reçu"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-3xl max-sm:top-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-none sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>Ajouter un devis reçu</DialogTitle>
            <DialogDescription>
              Enregistrez un devis reçu pour {props.lineLabel}, sans le retenir tout de suite.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={vendorMode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setVendorMode("existing")}
                disabled={pending || props.vendors.length === 0}
              >
                {VENDOR_LABELS.chooseExisting}
              </Button>
              <Button
                type="button"
                variant={vendorMode === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setVendorMode("new")}
                disabled={pending}
              >
                {VENDOR_LABELS.addNew}
              </Button>
            </div>

            {vendorMode === "existing" ? (
              <div className="grid gap-2">
                <Label htmlFor={`vendor-existing-${props.budgetLineId}`}>{VENDOR_LABELS.entity}</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger id={`vendor-existing-${props.budgetLineId}`}>
                    <SelectValue
                      placeholder={props.vendors.length > 0 ? VENDOR_LABELS.chooseExisting : VENDOR_LABELS.noExisting}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {props.vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {result?.fieldErrors?.vendorId ? <p className="text-sm text-red-600">{result.fieldErrors.vendorId}</p> : null}
              </div>
            ) : (
              <>
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
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`quote-amount-${props.budgetLineId}`}>
                  Montant{" "}
                  <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id={`quote-amount-${props.budgetLineId}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-required="true"
                />
                {result?.fieldErrors?.amount ? <p className="text-sm text-red-600">{result.fieldErrors.amount}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`quote-received-at-${props.budgetLineId}`}>
                  Reçu le{" "}
                  <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id={`quote-received-at-${props.budgetLineId}`}
                  type="date"
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  aria-required="true"
                />
                {result?.fieldErrors?.receivedAt ? <p className="text-sm text-red-600">{result.fieldErrors.receivedAt}</p> : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`quote-valid-until-${props.budgetLineId}`}>Valable jusqu&apos;au</Label>
              <Input
                id={`quote-valid-until-${props.budgetLineId}`}
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              {result?.fieldErrors?.validUntil ? <p className="text-sm text-red-600">{result.fieldErrors.validUntil}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`quote-scope-${props.budgetLineId}`}>Détail du devis</Label>
              <Textarea id={`quote-scope-${props.budgetLineId}`} rows={4} value={scope} onChange={(e) => setScope(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`quote-internal-note-${props.budgetLineId}`}>Note interne</Label>
              <Textarea id={`quote-internal-note-${props.budgetLineId}`} rows={3} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
            </div>

            <p className="text-muted-foreground text-sm">
              Vous pourrez ajouter des pièces jointes plus tard si besoin.
            </p>

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
                {pending ? "Enregistrement…" : "Ajouter le devis"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
