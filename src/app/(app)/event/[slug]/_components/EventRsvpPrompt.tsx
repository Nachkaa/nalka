// src/app/(app)/event/[slug]/_components/EventRsvpPrompt.tsx

"use client";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EventRsvpStatus } from "@prisma/client";
import { Check, HelpCircle, Pencil } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateRsvp } from "../actions/rsvp";

type Props = {
  eventId: string;
  slug: string;
  initialStatus: EventRsvpStatus;
  initialRespondedAt?: string | null;
  variant?: "card" | "inline";
};

const ACTIVE_CLASSES: Record<Exclude<EventRsvpStatus, "PENDING">, string> = {
  GOING: "bg-[var(--success-100)] text-[var(--success-900)] ring-1 ring-[var(--success-400)]",
  MAYBE: "bg-[var(--warning-100)] text-[var(--warning-900)] ring-1 ring-[var(--warning-400)]",
  NOT_GOING: "bg-[var(--danger-100)] text-[var(--danger-900)] ring-1 ring-[var(--danger-400)]",
};

export function EventRsvpPrompt({
  eventId,  initialStatus,
  initialRespondedAt,
  variant = "card",
}: Props) {
  const [status, setStatus] = useState<EventRsvpStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const key = `nalka:rsvp_prompt_dismissed:${eventId}`;
    const stored = window.localStorage.getItem(key);
    return !stored && initialStatus === "PENDING";
  });
  const [isEditing, setIsEditing] = useState(initialStatus === "PENDING");
  const dismissKey = useMemo(() => `nalka:rsvp_prompt_dismissed:${eventId}`, [eventId]);
  const respondedAtLabel = initialRespondedAt
    ? new Date(initialRespondedAt).toLocaleDateString("fr-FR")
    : null;

  const persistDismiss = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(dismissKey, new Date().toISOString());
  };

  const handleChoice = (next: EventRsvpStatus) => {
    if (status === next) {
      setOpen(false);
      setIsEditing(false);
      persistDismiss();
      return;
    }

    startTransition(async () => {
      const result = await updateRsvp({
        eventId,
        status: next,
      });

      if (!result.ok) {
        toast.error("Impossible d'enregistrer. R�essayer.");
        return;
      }

      setStatus(next);
      setOpen(false);
      setIsEditing(false);
      persistDismiss();
    });
  };

  const renderControl = () => (
    <div className="inline-flex w-full">
      <div
        className="bg-muted/40 grid w-full grid-cols-3 overflow-hidden rounded-full border p-1"
        role="radiogroup"
        aria-label="R�ponse pr�sence"
      >
        {[
          { value: EventRsvpStatus.GOING, label: "Je viens" },
          { value: EventRsvpStatus.MAYBE, label: "Peut-�tre" },
          { value: EventRsvpStatus.NOT_GOING, label: "Je ne viens pas" },
        ].map((option) => {
          const isActive = status === option.value;
          const palette = ACTIVE_CLASSES[option.value as Exclude<EventRsvpStatus, "PENDING">];
          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "focus-visible:ring-ring focus-visible:ring-offset-background h-11 min-h-11 justify-center rounded-full text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2",
                isActive ? palette : "text-muted-foreground hover:bg-background/70",
              )}
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive || status === "PENDING" ? 0 : -1}
              disabled={isPending}
              onClick={() => handleChoice(option.value)}
            >
              {isActive && <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />}
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );

  const renderBadgeRow = () => {
    if (status === "PENDING" && !isEditing) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Pr�sence : Pas encore r�pondu</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setIsEditing(true)}
          >
            R�pondre
            <StatusBadge status={status} />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted-foreground text-sm">Pr�sence :</span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <StatusBadge status={status} />
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Modifier
        </Button>
      </div>
    );
  };

  const body = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-foreground text-base font-semibold">Ta pr�sence</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Pourquoi ?"
              className="border-border text-muted-foreground hover:bg-muted/50 focus-visible:outline-ring inline-flex h-6 w-6 items-center justify-center rounded-full border focus-visible:outline focus-visible:outline-offset-2"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 text-sm leading-relaxed">
            Tu ne vois jamais les r�ponses des autres participants. L&apos;organisateur voit seulement un
            total pour s&apos;organiser.
          </PopoverContent>
        </Popover>
      </div>

      {renderBadgeRow()}

      {respondedAtLabel && status !== EventRsvpStatus.PENDING && (
        <p className="text-muted-foreground text-xs">R�pondu le {respondedAtLabel}</p>
      )}

      {(isEditing || status === "PENDING") && <div className="pt-1">{renderControl()}</div>}
    </div>
  );

  if (variant === "inline") {
    return <div className="rounded-xl border border-dashed bg-transparent px-3 py-3">{body}</div>;
  }

  return <section className="bg-card rounded-xl border px-4 py-4">{body}</section>;
}
