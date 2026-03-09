// app/(app)/event/[slug]/_components/poll/PollDetailsDialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { deletePoll } from "../../actions/polls";
import { PollOptionsManage } from "./PollOptionsManage";

export function PollDetailsDialog({
  open,
  onOpenChange,
  poll,
  slug,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  poll: EventPollVM;
  slug: string;
  isPending: boolean;
}) {
  const router = useRouter();
  const isOpen = poll.status === "OPEN";
  const optionsCount = poll.options.length;
  const totalVotes = poll.options.reduce((acc, o) => acc + o.count, 0);
  const [openAdd, setOpenAdd] = React.useState(false);

  const title = poll.type === "SCHEDULE" ? "Gérer le sondage - Date" : "Gérer le sondage - Lieu";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden p-0",
          "w-[calc(100vw-24px)] max-w-2xl",
          "sm:rounded-xl",
          "max-sm:top-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-none",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b px-4 py-3">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex flex-wrap items-center gap-2 pr-10">
                <DialogTitle className="truncate text-base font-semibold">{title}</DialogTitle>
                <Badge variant={isOpen ? "secondary" : "outline"}>{isOpen ? "Ouvert" : "Fermé"}</Badge>
              </div>

              <div className="text-muted-foreground text-xs">
                {optionsCount} option{optionsCount > 1 ? "s" : ""} • {totalVotes} vote
                {totalVotes > 1 ? "s" : ""}
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
              <PollOptionsManage
                slug={slug}
                poll={poll}
                isPending={isPending}
                showAddRow={openAdd}
                onCloseAddRow={() => setOpenAdd(false)}
              />
            </div>
          </div>

          <div className="border-t px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              {isOpen ? (
                <Button
                  size="sm"
                  className="rounded-md"
                  onClick={() => setOpenAdd(true)}
                  disabled={isPending}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter un élément
                </Button>
              ) : (
                <div />
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={isPending}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Supprimer le sondage
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce sondage ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Toutes les options et tous les votes seront supprimés définitivement.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        await deletePoll({ slug, pollId: poll.id });
                        onOpenChange(false);
                        router.refresh();
                      }}
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

