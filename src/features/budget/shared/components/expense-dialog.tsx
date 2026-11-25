"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatSharedMoney, parseEuroAmount, type SharedExpenseInput } from "../forms";
import { splitEqually } from "../calculations";
import type { SharedBudgetResult, SharedBudgetView, SharedExpenseView } from "../types";

export function ExpenseDialog({
  data,
  expense,
  onClose,
  onSubmit,
}: {
  data: SharedBudgetView;
  expense: SharedExpenseView | null;
  onClose: () => void;
  onSubmit: (input: SharedExpenseInput) => Promise<SharedBudgetResult>;
}) {
  const [id] = useState(() => expense?.id ?? crypto.randomUUID());
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(
    expense ? (expense.amountCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [payerId, setPayerId] = useState(expense?.payerId ?? data.myParticipantId);
  const [selected, setSelected] = useState(
    expense?.shares.map((s) => s.participantId) ?? [data.myParticipantId],
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const choices = data.participants.filter(
    (p) =>
      p.active ||
      p.id === expense?.payerId ||
      expense?.shares.some((s) => s.participantId === p.id),
  );
  const allIds = data.participants.filter((p) => p.active).map((p) => p.id);
  const allSelected = allIds.every((id) => selected.includes(id));
  const cents = parseEuroAmount(amount);
  const shares = cents && selected.length ? splitEqually(cents, selected) : [];
  const min = shares.length ? Math.min(...shares.map((s) => s.amountCents)) : 0;
  const max = shares.length ? Math.max(...shares.map((s) => s.amountCents)) : 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!cents) {
      setError("Indiquez un montant positif, avec deux décimales maximum.");
      return;
    }
    if (!description.trim()) {
      setError("Décrivez la dépense.");
      return;
    }
    if (!selected.length) {
      setError("Sélectionnez au moins une personne.");
      return;
    }
    setError("");
    setPending(true);
    const result = await onSubmit({
      id,
      version: expense?.version,
      description,
      amountCents: cents,
      payerId,
      participantIds: selected,
    });
    setPending(false);
    if (result.ok) onClose();
    else setError(result.error);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "Modifier la dépense" : "Ajouter une dépense"}</DialogTitle>
          <DialogDescription>Qui a payé, pour qui ? On s’occupe des comptes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <fieldset disabled={pending} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                placeholder="Courses pour le chalet, forfaits de ski…"
                required
                maxLength={160}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Montant (€)</Label>
                <Input
                  id="expense-amount"
                  inputMode="decimal"
                  placeholder="25,00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-payer">Payé par</Label>
                <select
                  id="expense-payer"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                >
                  {choices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id === data.myParticipantId ? `${p.name} (moi)` : p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium">Pour qui ?</legend>
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                  {selected.length} personne{selected.length > 1 ? "s" : ""} sélectionnée
                  {selected.length > 1 ? "s" : ""}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(allSelected ? [data.myParticipantId] : allIds)}
                >
                  {allSelected ? "Moi uniquement" : "Tout le groupe"}
                </Button>
              </div>
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border p-2">
                {choices.map((p) => (
                  <label
                    key={p.id}
                    className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary h-4 w-4"
                      checked={selected.includes(p.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, p.id]
                            : selected.filter((id) => id !== p.id),
                        )
                      }
                    />
                    <span>
                      {p.name}
                      {p.id === data.myParticipantId ? " (moi)" : ""}
                      {!p.active ? " · ancien participant" : ""}
                    </span>
                  </label>
                ))}
              </div>
              {shares.length ? (
                <p className="text-muted-foreground text-sm">
                  {min === max
                    ? formatSharedMoney(min)
                    : `${formatSharedMoney(min)} à ${formatSharedMoney(max)}`}{" "}
                  par personne, au centime près.
                </p>
              ) : null}
            </fieldset>
          </fieldset>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : expense ? "Enregistrer" : "Ajouter la dépense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
