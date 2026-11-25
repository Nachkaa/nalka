"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  Check,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelSharedRepayment,
  deleteSharedExpense,
  recordSharedRepayment,
  saveSharedExpense,
} from "@/app/(app)/event/[slug]/budget/shared-actions";
import { formatSharedMoney as money, parseEuroAmount } from "../forms";
import type {
  SharedBudgetResult,
  SharedBudgetView,
  SharedExpenseView,
  SharedTransfer,
} from "../types";
import { ExpenseDialog } from "./expense-dialog";

type Confirmation =
  | { kind: "expense"; expense: SharedExpenseView }
  | { kind: "repayment"; id: string };
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function SharedBudgetScreen({ initial }: { initial: SharedBudgetView }) {
  const [data, setData] = useState(initial);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editing, setEditing] = useState<SharedExpenseView | null>(null);
  const [repayment, setRepayment] = useState<(SharedTransfer & { id: string }) | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState<"ok" | "offline" | "denied">("ok");
  const revision = useRef(0);
  const writing = useRef(false);
  const seenExpenses = useRef(new Set(initial.expenses.map((e) => e.id)));

  useEffect(() => {
    let running = false;
    const controller = new AbortController();
    async function refresh() {
      if (running || writing.current || document.visibilityState === "hidden") return;
      running = true;
      const ticket = revision.current;
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(initial.slug)}/expenses`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          if (ticket === revision.current)
            setConnection(
              response.status === 401 || response.status === 404 ? "denied" : "offline",
            );
          return;
        }
        const next: SharedBudgetView = await response.json();
        if (ticket !== revision.current || controller.signal.aborted) return;
        const added = next.expenses.find((e) => !e.deletedAt && !seenExpenses.current.has(e.id));
        seenExpenses.current = new Set(next.expenses.map((e) => e.id));
        setData(next);
        setConnection("ok");
        if (added) {
          const name =
            next.participants.find((p) => p.id === added.payerId)?.name ?? "Un participant";
          toast.info(`${name} a ajouté « ${added.description} ».`);
        }
      } catch {
        if (!controller.signal.aborted && ticket === revision.current) setConnection("offline");
      } finally {
        running = false;
      }
    }
    const timer = setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [initial.slug]);

  async function mutate(operation: () => Promise<SharedBudgetResult>): Promise<SharedBudgetResult> {
    if (writing.current) return { ok: false, error: "Une opération est déjà en cours." };
    writing.current = true;
    revision.current++;
    setBusy(true);
    setError("");
    let result: SharedBudgetResult;
    try {
      result = await operation();
    } catch {
      result = { ok: false, error: "L’enregistrement n’a pas pu être confirmé. Réessayez." };
    }
    if (result.ok) {
      revision.current++;
      seenExpenses.current = new Set(result.data.expenses.map((e) => e.id));
      setData(result.data);
      setConnection("ok");
    } else setError(result.error);
    writing.current = false;
    setBusy(false);
    return result;
  }
  const name = (id: string) =>
    data.participants.find((p) => p.id === id)?.name ?? "Ancien participant";
  const me = data.myParticipantId;
  const myExpenses = data.expenses.filter((e) => !e.deletedAt && e.payerId === me);
  const transfers = data.transfers.filter(
    (t) =>
      data.controlledParticipantIds.includes(t.fromId) ||
      data.controlledParticipantIds.includes(t.toId),
  );
  const history = [
    ...data.expenses.map((expense) => ({
      kind: "expense" as const,
      id: expense.id,
      createdAt: expense.createdAt,
      expense,
    })),
    ...data.repayments.map((payment) => ({
      kind: "repayment" as const,
      id: payment.id,
      createdAt: payment.createdAt,
      payment,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  const blocked = busy || connection === "denied";

  function expenseRow(expense: SharedExpenseView) {
    return (
      <article
        key={expense.id}
        className={`rounded-2xl border bg-white p-4 ${expense.deletedAt ? "opacity-60" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div className="bg-primary/5 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <ReceiptText className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className={`font-medium break-words ${expense.deletedAt ? "line-through" : ""}`}>
                {expense.description}
              </h3>
              <span className="shrink-0 font-semibold tabular-nums">
                {money(expense.amountCents)}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {expense.payerId === me ? "Payé par moi" : `Payé par ${name(expense.payerId)}`} ·{" "}
              {dateLabel(expense.createdAt)}
              {expense.deletedAt
                ? " · Supprimée"
                : expense.version > 1
                  ? " · Modifiée"
                  : ""}
            </p>
            <details className="mt-2 text-sm">
              <summary className="text-muted-foreground cursor-pointer">
                Pour {expense.shares.length} personne{expense.shares.length > 1 ? "s" : ""}
              </summary>
              <ul className="mt-2 space-y-1">
                {expense.shares.map((s) => (
                  <li key={s.participantId} className="flex justify-between gap-3">
                    <span>
                      {name(s.participantId)}
                      {s.participantId === me ? " (moi)" : ""}
                    </span>
                    <span className="tabular-nums">{money(s.amountCents)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-2 text-xs">
                Enregistrée par {expense.createdByName}.
              </p>
            </details>
            {expense.canEdit ? (
              <div className="mt-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={blocked}
                  onClick={() => {
                    setEditing(expense);
                    setExpenseOpen(true);
                    setError("");
                  }}
                >
                  <Pencil className="mr-1 size-3.5" aria-hidden="true" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={blocked}
                  onClick={() => {
                    setConfirmation({ kind: "expense", expense });
                    setError("");
                  }}
                >
                  <Trash2 className="mr-1 size-3.5" aria-hidden="true" />
                  Supprimer
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Les dépenses du groupe, les comptes au clair.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setExpenseOpen(true);
            setError("");
          }}
          disabled={blocked}
        >
          <Plus className="mr-2 size-4" aria-hidden="true" />
          Ajouter une dépense
        </Button>
      </div>
      <p
        role="status"
        className={`text-xs ${connection === "ok" ? "text-muted-foreground" : "text-destructive"}`}
      >
        {connection === "ok"
          ? "Actualisation automatique · les comptes se mettent à jour sans clôture."
          : connection === "denied"
            ? "Votre accès au budget a changé. Revenez à l’événement ou reconnectez-vous."
            : "Connexion interrompue : les montants affichés peuvent ne pas être à jour."}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "J’ai avancé", amount: data.mine.paidCents, icon: Wallet },
          { label: "Ma part des dépenses", amount: data.mine.shareCents, icon: ReceiptText },
          {
            label:
              data.mine.balanceCents < 0
                ? "Je dois encore"
                : data.mine.balanceCents > 0
                  ? "On me doit"
                  : "Mon solde est équilibré",
            amount: Math.abs(data.mine.balanceCents),
            icon: ArrowDownLeft,
          },
        ].map(({ label, amount, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-white p-5">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{money(amount)}</p>
          </div>
        ))}
      </div>

      <section
        aria-labelledby="repayment-heading"
        className="border-primary/15 bg-primary/5 rounded-2xl border p-5"
      >
        <h2 id="repayment-heading" className="font-semibold">
          Mes remboursements
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {data.optimal
            ? "Les dettes sont compensées avec le minimum de virements."
            : "Les dettes sont compensées pour limiter le nombre de virements."}
        </p>
        {transfers.length ? (
          <div className="mt-4 space-y-3">
            {transfers.map((t) => {
              const outgoing = data.controlledParticipantIds.includes(t.fromId);
              return (
                <div
                  key={`${t.fromId}-${t.toId}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
                >
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <span>{t.fromId === me ? "Moi" : name(t.fromId)}</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                      <span>{t.toId === me ? "Moi" : name(t.toId)}</span>
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {money(t.amountCents)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={blocked}
                    onClick={() => {
                      setRepayment({ ...t, id: crypto.randomUUID() });
                      setError("");
                    }}
                  >
                    {outgoing ? "J’ai remboursé" : "J’ai reçu le remboursement"}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-sm">
            <Check className="size-4" aria-hidden="true" />
            Aucun remboursement à effectuer de ton côté.
          </p>
        )}
      </section>
      {error && !expenseOpen && !repayment && !confirmation ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <Tabs defaultValue="mine" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2">
          <TabsTrigger className="text-xs sm:text-sm" value="mine">
            Mes dépenses ({myExpenses.length})
          </TabsTrigger>
          <TabsTrigger className="text-xs sm:text-sm" value="history">
            Tout l’historique ({history.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mine" className="space-y-3">
          {myExpenses.length ? (
            myExpenses.map(expenseRow)
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <ReceiptText
                className="text-muted-foreground mx-auto mb-3 size-8"
                aria-hidden="true"
              />
              <p className="font-medium">Aucune dépense avancée pour le moment</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Courses, repas, forfaits… Ajoute ce que tu as payé pour toi ou pour le groupe.
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history" className="space-y-3">
          {!history.length ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
              Les dépenses et remboursements du groupe apparaîtront ici.
            </p>
          ) : (
            history.map((item) =>
              item.kind === "expense" ? (
                expenseRow(item.expense)
              ) : (
                <article
                  key={item.id}
                  className={`rounded-2xl border bg-white p-4 ${item.payment.cancelledAt ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">
                        {name(item.payment.fromId)} → {name(item.payment.toId)}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Remboursement {item.payment.cancelledAt ? "annulé" : "enregistré"} par{" "}
                        {item.payment.createdByName} · {dateLabel(item.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {money(item.payment.amountCents)}
                    </span>
                  </div>
                  {item.payment.canCancel ? (
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="ghost"
                      disabled={blocked}
                      onClick={() => {
                        setConfirmation({ kind: "repayment", id: item.id });
                        setError("");
                      }}
                    >
                      Annuler cet enregistrement
                    </Button>
                  ) : null}
                </article>
              ),
            )
          )}
        </TabsContent>
      </Tabs>

      {expenseOpen ? (
        <ExpenseDialog
          data={data}
          expense={editing}
          onClose={() => setExpenseOpen(false)}
          onSubmit={(input) => mutate(() => saveSharedExpense(data.slug, input))}
        />
      ) : null}
      {repayment ? (
        <RepaymentDialog
          transfer={repayment}
          names={{ from: name(repayment.fromId), to: name(repayment.toId) }}
          onClose={() => setRepayment(null)}
          onSubmit={(amountCents) =>
            mutate(() => recordSharedRepayment(data.slug, { ...repayment, amountCents }))
          }
        />
      ) : null}
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmation?.kind === "expense"
                ? "Supprimer cette dépense ?"
                : "Annuler ce remboursement ?"}
            </DialogTitle>
            <DialogDescription>
              Les soldes seront recalculés. L’opération restera visible dans l’historique.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" disabled={busy} onClick={() => setConfirmation(null)}>
              Retour
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (!confirmation) return;
                const target = confirmation;
                const result = await mutate(() =>
                  target.kind === "expense"
                    ? deleteSharedExpense(data.slug, {
                        id: target.expense.id,
                        version: target.expense.version,
                      })
                    : cancelSharedRepayment(data.slug, target.id),
                );
                if (result.ok) setConfirmation(null);
              }}
            >
              {busy ? "Enregistrement…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RepaymentDialog({
  transfer,
  names,
  onClose,
  onSubmit,
}: {
  transfer: SharedTransfer;
  names: { from: string; to: string };
  onClose: () => void;
  onSubmit: (amountCents: number) => Promise<SharedBudgetResult>;
}) {
  const [amount, setAmount] = useState((transfer.amountCents / 100).toFixed(2).replace(".", ","));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const cents = parseEuroAmount(amount);
    if (!cents || cents > transfer.amountCents) {
      setError("Le montant doit être positif et ne pas dépasser le remboursement proposé.");
      return;
    }
    setPending(true);
    setError("");
    const result = await onSubmit(cents);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un remboursement</DialogTitle>
          <DialogDescription>
            {names.from} a remboursé {names.to}. Confirme uniquement un transfert déjà effectué :
            aucun argent n’est envoyé depuis Nalka.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repayment-amount">Montant remboursé (€)</Label>
            <Input
              id="repayment-amount"
              inputMode="decimal"
              required
              autoFocus
              disabled={pending}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
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
              {pending ? "Enregistrement…" : "Confirmer le remboursement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
