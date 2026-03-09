"use client";

import { ArrowLeft, Mail, UserPlus, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { InviteMemberForm } from "./AddEventMembers";

type Props = {
  eventId: string;
  slug: string;
  context?: "event" | "participants" | "header";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddParticipantLauncher({
  eventId,
  slug,
  context = "event",
  open: openProp,
  onOpenChange,
}: Props) {
  const [open, setOpen] = React.useState(openProp ?? false);
  const [mode, setMode] = React.useState<"choice" | "email">("choice");

  React.useEffect(() => {
    if (typeof openProp === "boolean") {
      setOpen(openProp);
    }
  }, [openProp]);

  function closeDialog() {
    setOpen(false);
    setMode("choice");
  }

  const addRelativeHref =
    context === "participants"
      ? `/event/${slug}/participants/add-relative?from=participants`
      : `/event/${slug}/participants/add-relative?from=event`;

  // ----- TRIGGER UI SELON LE CONTEXTE -----
  const trigger =
    context === "event" ? (
      // Vue EVENT : avatar rond, full primary
      <button type="button" className="group flex w-16 cursor-pointer flex-col items-center gap-1">
        <span
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-full",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "shadow-sm transition hover:shadow-md hover:brightness-105",
            "focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none",
          )}
        >
          <UserPlus className="h-5 w-5" aria-hidden="true" />
        </span>

        <span className="w-full truncate text-center text-xs font-medium text-[var(--primary)] group-hover:underline">
          Ajouter
        </span>
      </button>
    ) : context === "header" ? (
      <Button
        type="button"
        variant="soft"
        size="sm"
        className="inline-flex items-center gap-2 rounded-lg px-3 sm:px-4"
        title="Inviter"
        aria-label="Inviter"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Inviter</span>
      </Button>
    ) : (
      // Vue PARTICIPANTS : gros bouton primaire pleine largeur
      <button
        type="button"
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-sm font-medium",
          "bg-[var(--primary)] text-[var(--primary-foreground)]",
          "shadow-sm transition hover:shadow-md hover:brightness-105",
          "focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none",
        )}
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        <span>Ajouter un participant</span>
      </button>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (typeof openProp !== "boolean") {
          setOpen(v);
        }
        onOpenChange?.(v);
        if (!v) setMode("choice");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {mode === "choice" ? (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle>Ajouter un participant</DialogTitle>
              <DialogDescription>
                Choisis comment tu veux ajouter quelqu&apos;un à cet événement.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex flex-col gap-3">
              <Button
                type="button"
                className="flex w-full items-center justify-start gap-2 py-3 text-sm sm:text-base"
                onClick={() => setMode("email")}
              >
                <Mail className="h-5 w-5" aria-hidden="true" />
                <span>Inviter par e-mail</span>
              </Button>

              <Button
                asChild
                type="button"
                variant="outline"
                className="flex w-full items-center justify-start gap-2 py-3 text-sm sm:text-base"
                onClick={closeDialog}
              >
                <Link href={addRelativeHref}>
                  <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
                  <span>Ajouter un proche sans compte</span>
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-xs"
              onClick={() => setMode("choice")}
            >
              <ArrowLeft className="h-3 w-3" />
              Retour
            </button>

            <DialogHeader className="space-y-1">
              <DialogTitle>Inviter par e-mail</DialogTitle>
              <DialogDescription>
                Entrez son e-mail. Il apparaîtra dans l’événement une fois invité.
              </DialogDescription>
            </DialogHeader>

            <InviteMemberForm eventId={eventId} onCancel={closeDialog} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
