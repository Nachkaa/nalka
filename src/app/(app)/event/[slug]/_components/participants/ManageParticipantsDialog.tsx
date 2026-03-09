"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { UserMinus, Users } from "lucide-react";
import { removeMemberAction } from "../../actions/participants";
import type { EventMember, User } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EventMembershipWithUser = EventMember & {
  user: User | null;
};

type Props = {
  eventId: string;
  memberships: EventMembershipWithUser[];
  canRemoveByUserId: Record<string, boolean>;
};

function displayName(u?: { name: string | null; email: string | null } | null) {
  if (!u) return "Inconnu";
  if (u.name && u.name.trim()) return u.name.trim();
  return u.email ?? "Inconnu";
}

export function ManageParticipantsDialog({ eventId, memberships, canRemoveByUserId }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
          <Users className="mr-1 h-3 w-3" />
          Gérer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer les participants</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          {memberships.map((m) => {
            const name = displayName(m.user);
            const canRemove = !!canRemoveByUserId[m.userId];

            const initials = (m.user?.name ?? m.user?.email ?? "?")
              .split(/[^\p{L}\p{N}]+/u)
              .filter(Boolean)
              .slice(0, 2)
              .map((s) => s[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={`manage-${m.userId}`}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--sidebar-primary)] ring-1 ring-[var(--border)]">
                    {initials}
                  </div>
                  <div className="text-sm">{name}</div>
                </div>

                {canRemove && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Retirer ce participant"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Retirer {name} ?</AlertDialogTitle>

                        <AlertDialogDescription>
                          {name} sera retiré de cet événement et tout ce qui lui est lié (liste,
                          réservations, idées…) sera supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <AlertDialogCancel asChild>
                          <Button type="button" variant="outline" className="w-full sm:w-auto">
                            Annuler
                          </Button>
                        </AlertDialogCancel>

                        <form action={removeMemberAction} className="w-full sm:w-auto">
                          <input type="hidden" name="eventId" value={eventId} />
                          <input type="hidden" name="userIdToRemove" value={m.userId} />

                          {/* ICI on utilise AlertDialogAction directement, sans Button */}
                          <AlertDialogAction
                            type="submit"
                            className={cn(
                              buttonVariants({ variant: "destructive", size: "default" }),
                              "w-full",
                            )}
                          >
                            Retirer
                          </AlertDialogAction>
                        </form>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
