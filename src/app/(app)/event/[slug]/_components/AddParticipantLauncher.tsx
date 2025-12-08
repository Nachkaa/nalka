"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, UserRoundPlus, UserPlus, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { InviteMemberForm } from "../_components/AddEventMembers";

type Props = {
    eventId: string;
    slug: string;
    context?: "event" | "participants";
};

export function AddParticipantLauncher({ eventId, slug, context = "event" }: Props) {
    const [open, setOpen] = React.useState(false);
    const [mode, setMode] = React.useState<"choice" | "email">("choice");

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
            <button
                type="button"
                className="group flex w-16 flex-col items-center gap-1 cursor-pointer"
            >
                <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full 
                               bg-[var(--primary)] text-[var(--primary-foreground)]
                               shadow-sm transition 
                               hover:shadow-md hover:brightness-105
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                >
                    <UserPlus className="h-5 w-5" aria-hidden="true" />
                </span>

                <span className="w-full truncate text-center text-xs font-medium text-[var(--primary)] group-hover:underline">
                    Ajouter
                </span>
            </button>
        ) : (
            // Vue PARTICIPANTS : gros bouton primaire pleine largeur
            <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full 
                           bg-[var(--primary)] px-6 text-sm font-medium 
                           text-[var(--primary-foreground)]
                           shadow-sm transition 
                           hover:shadow-md hover:brightness-105
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2
                           cursor-pointer"
            >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>Ajouter un participant</span>
            </button>
        );

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
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
                            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground"
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

                        <InviteMemberForm
                            eventId={eventId}
                            onDone={closeDialog}
                            onCancel={closeDialog}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
