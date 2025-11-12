"use client";

import { useEffect, useRef, useState, useTransition, ReactNode } from "react";
import { inviteMember } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";

type DialogProps = {
  eventId: string;
  asChild?: boolean;
  children?: ReactNode;
  defaultOpen?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMemberDialog({
  eventId,
  asChild,
  children,
  defaultOpen = false,
}: DialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [email, setEmail] = useState("");
  const [lastEmail, setLastEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else {
      setStatus("idle");
      setErrorMsg(null);
      setEmail("");
    }
  }, [open]);

  function normalizeEmail(v: string) {
    return v.trim().toLowerCase();
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = normalizeEmail(email);
    if (!EMAIL_RE.test(value)) {
      setErrorMsg("Email invalide");
      return;
    }
    setErrorMsg(null);
    setStatus("pending");

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("eventId", eventId);
        fd.append("email", value);

        setLastEmail(value);
        await inviteMember(fd);
        setStatus("success");
        setEmail("");
        inputRef.current?.focus();
      } catch {
        setStatus("error");
        setErrorMsg("Envoi impossible. Réessayez.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={asChild}>
        {asChild ? (
          children
        ) : (
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {status === "success" ? "Invitation envoyée" : "Inviter un participant"}
          </DialogTitle>
          <DialogDescription>
            {status === "success"
              ? `${lastEmail} a bien reçu une invitation. Vous pouvez en ajouter un autre.`
              : "Entrez son e-mail. Il apparaîtra dans l’événement une fois invité."}
          </DialogDescription>
        </DialogHeader>

        <div role="status" aria-live="polite" className="space-y-2">
          {status === "success" && (
            <p className="inline-flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Invitation envoyée
            </p>
          )}
          {status === "error" && (
            <p className="inline-flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {errorMsg}
            </p>
          )}
        </div>

        <form onSubmit={handleInvite} className="grid gap-4">
          <input type="hidden" name="eventId" value={eventId} />

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="prenom@exemple.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => setEmail(normalizeEmail(e.target.value))}
              ref={inputRef}
              aria-invalid={!!errorMsg}
              aria-describedby={errorMsg ? "invite-error" : undefined}
              disabled={isPending}
            />
            {errorMsg && (
              <p id="invite-error" className="text-xs text-red-600">
                {errorMsg}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isPending || !email} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Envoi…
              </>
            ) : (
              "Inviter"
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Fermer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Empty-state CTA reusing the same dialog */
export function InviteEmptyStateCTA({ eventId }: { eventId: string }) {
  return (
    <InviteMemberDialog eventId={eventId} asChild>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2
                   text-[var(--primary-foreground)] shadow hover:opacity-90"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Ajouter un participant
      </button>
    </InviteMemberDialog>
  );
}
