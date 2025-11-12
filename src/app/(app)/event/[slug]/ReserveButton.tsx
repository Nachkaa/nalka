"use client";

import { useOptimistic, useTransition } from "react";
import { reserveItem, cancelReservation } from "./reserve";
import { Gift, XCircle, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  itemId: string;
  eventId: string;
  /** true if I have the reservation */
  initialIsMine: boolean;
  /** true if someone else has it */
  initialTakenByOther: boolean;
  /** text to show when taken by someone and not anonymous, e.g. "Juliette" */
  reservedByName?: string | null;
  /** notify parent so it can reorder */
  onOptimisticChange?: (nextIsMine: boolean) => void;
  /** optional extra classes (e.g. "w-full" on mobile) */
  className?: string;
};

type Optimistic = { isMine: boolean; takenByOther: boolean };

export default function ReserveButton({
  itemId,
  eventId,
  initialIsMine,
  initialTakenByOther,
  reservedByName,
  onOptimisticChange,
  className,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useOptimistic<Optimistic, Optimistic>(
    { isMine: initialIsMine, takenByOther: initialTakenByOther },
    (_, next) => next,
  );

  const disabled = state.takenByOther;

  // no fixed width; default to a compact width unless caller overrides with className
  const base =
    "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors justify-center";
  const tone = state.isMine
    ? "cursor-pointer bg-[var(--chart-4)] text-[var(--primary-foreground)] hover:bg-[color-mix(in_oklch,var(--destructive),black_10%)]"
    : disabled
    ? "cursor-not-allowed bg-[var(--muted)] text-[var(--muted-foreground)]"
    : "cursor-pointer bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]";

  // apply a sensible default width if none provided
  const defaultWidth = className ? "" : "w-28";

  function onClick() {
    if (isPending || disabled) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("itemId", itemId);
      fd.set("eventId", eventId);

      if (state.isMine) {
        const prev = state;
        setState({ isMine: false, takenByOther: false });
        onOptimisticChange?.(false);
        try {
          await cancelReservation(fd);
        } catch (e) {
          setState(prev);
          onOptimisticChange?.(true);
          console.error("cancelReservation failed", e);
        }
        return;
      }

      const prev = state;
      setState({ isMine: true, takenByOther: false });
      onOptimisticChange?.(true);
      try {
        await reserveItem(fd);
      } catch (e: any) {
        const msg = typeof e?.message === "string" ? e.message : "";
        if (msg.toLowerCase().includes("already reserved")) {
          setState({ isMine: false, takenByOther: true });
          onOptimisticChange?.(false);
        } else if (msg.toLowerCase().includes("forbidden")) {
          setState(prev);
          onOptimisticChange?.(prev.isMine);
        } else {
          setState(prev);
          onOptimisticChange?.(prev.isMine);
        }
        console.error("reserveItem failed", e);
      }
    });
  }

  const takenLabel = reservedByName ? `Pris par ${reservedByName}` : "Pris";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, tone, defaultWidth, className)}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      aria-live="polite"
      title={disabled ? takenLabel : undefined}
      aria-label={
        isPending
          ? "Action en cours"
          : state.isMine
          ? "Annuler ma réservation"
          : disabled
          ? takenLabel
          : "Réserver"
      }
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> …
        </>
      ) : state.isMine ? (
        <>
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Annuler
        </>
      ) : disabled ? (
        <>
          <Lock className="h-4 w-4" aria-hidden="true" />
          {takenLabel}
        </>
      ) : (
        <>
          <Gift className="h-4 w-4" aria-hidden="true" />
          Réserver
        </>
      )}
    </button>
  );
}
