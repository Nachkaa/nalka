"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventRsvpStatus } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { Check, HelpCircle, Pencil, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { UpdateRsvpAction } from "../types";

type Props = {
  eventId: string;
  initialStatus: EventRsvpStatus;
  status?: EventRsvpStatus;
  onStatusChange?: (status: EventRsvpStatus) => void;
  rightSlot?: ReactNode;
  mode?: "compact" | "full";
  updateRsvpAction: UpdateRsvpAction;
};

const OPTIONS: Array<{ value: EventRsvpStatus; label: string }> = [
  { value: EventRsvpStatus.GOING, label: "Je viens" },
  { value: EventRsvpStatus.MAYBE, label: "Peut-être" },
  { value: EventRsvpStatus.NOT_GOING, label: "Je ne viens pas" },
];

function statusLabel(status: EventRsvpStatus) {
  return OPTIONS.find((option) => option.value === status)?.label ?? "Indiquez si vous venez";
}

const STATUS_ICONS: Record<EventRsvpStatus, LucideIcon> = {
  [EventRsvpStatus.PENDING]: X,
  [EventRsvpStatus.GOING]: Check,
  [EventRsvpStatus.MAYBE]: HelpCircle,
  [EventRsvpStatus.NOT_GOING]: X,
};

function statusPillClasses(status: EventRsvpStatus) {
  if (status === EventRsvpStatus.GOING) {
    return "bg-[color:var(--success-light)] text-[color:var(--success-dark)] border-[color:var(--success-dark)]";
  }
  if (status === EventRsvpStatus.MAYBE) {
    return "bg-[color:var(--warning-light)] text-[color:var(--warning-dark)] border-[color:var(--warning-dark)]";
  }
  return "bg-[color:var(--danger-light)] text-[color:var(--danger-dark)] border-[color:var(--danger-dark)]";
}

export function RsvpBar({
  eventId,
  initialStatus,
  status: statusProp,
  onStatusChange,
  rightSlot,
  mode = "compact",
  updateRsvpAction,
}: Props) {
  const [status, setStatus] = useState<EventRsvpStatus>(statusProp ?? initialStatus);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const effectiveStatus = statusProp ?? status;

  const Icon = STATUS_ICONS[effectiveStatus];

  const handleSelect = (next: EventRsvpStatus) => {
    if (effectiveStatus === next) {
      setEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await updateRsvpAction({ eventId, status: next });

      if (!result.ok) {
        toast.error("Impossible d'enregistrer. Réessayer.");
        return;
      }

      if (!statusProp) {
        setStatus(next);
      }
      onStatusChange?.(next);
      setEditing(false);
    });
  };

  const renderSelector = (showCancel: boolean) => (
    <div
      className="w-full space-y-3 rounded-xl bg-white p-3 md:space-y-4 md:p-4"
      role="radiogroup"
      aria-label="Réponse présence"
    >
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {OPTIONS.map((option) => {
          const isActive = effectiveStatus === option.value;
          const OptionIcon = STATUS_ICONS[option.value];
          const colorClasses =
            option.value === EventRsvpStatus.GOING
              ? "border-[color:var(--success-dark)] bg-[color:var(--success-light)] text-[color:var(--success-dark)]"
              : option.value === EventRsvpStatus.MAYBE
                ? "border-[color:var(--warning-dark)] bg-[color:var(--warning-light)] text-[color:var(--warning-dark)]"
                : "border-[color:var(--danger-dark)] bg-[color:var(--danger-light)] text-[color:var(--danger-dark)]";

          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "bg-background h-14 flex-col justify-center gap-1 rounded-xl border text-xs font-semibold shadow-sm transition md:h-16 md:text-sm",
                isActive ? colorClasses : "border-border text-foreground",
              )}
              aria-pressed={isActive}
              disabled={isPending}
              onClick={() => handleSelect(option.value)}
            >
              <OptionIcon className="h-4 w-4" aria-hidden="true" />
              <span className="whitespace-nowrap">{option.label}</span>
            </Button>
          );
        })}
      </div>

      {showCancel ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="h-10 w-full justify-center rounded-lg px-3 text-xs font-semibold md:h-11 md:text-sm"
          onClick={() => setEditing(false)}
          disabled={isPending}
        >
          Annuler
        </Button>
      ) : null}
    </div>
  );

  const isCompact = mode === "compact";
  const selectorOpen = editing;
  const isPendingStatus = effectiveStatus === EventRsvpStatus.PENDING;

  return (
    <div className={cn("w-full", !isCompact && "md:w-auto")}>
      <div className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap",
              statusPillClasses(effectiveStatus),
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className={cn("truncate", isCompact ? "max-[360px]:hidden" : "block")}>
              {statusLabel(effectiveStatus)}
            </span>
          </span>

          <Button
            type="button"
            variant={isPendingStatus ? "default" : "soft"}
            size="sm"
            className={cn("h-8 rounded-full px-3 font-semibold sm:px-4", !isCompact && "md:h-9")}
            onClick={() => setEditing((value) => !value)}
            disabled={isPending}
            aria-label={isPendingStatus ? "Ma présence" : "Modifier ma présence"}
            title={isPendingStatus ? "Ma présence" : "Modifier ma présence"}
            aria-expanded={selectorOpen}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {isPendingStatus ? "Ma présence" : "Modifier ma présence"}
            </span>
          </Button>
        </div>

        {rightSlot ? <div className="flex shrink-0 items-center gap-2">{rightSlot}</div> : null}
      </div>

      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-in-out",
          selectorOpen
            ? "max-h-[340px] translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-1 opacity-0",
        )}
        aria-hidden={!selectorOpen}
      >
        <div className={cn("pt-3", !selectorOpen && "pointer-events-none")}>
          {renderSelector(true)}
        </div>
      </div>
    </div>
  );
}
