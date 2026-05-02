"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { PotluckItem as PotluckItemType } from "../types";

type PotluckItemProps = {
  item: PotluckItemType;
  currentUserId?: string;
  totalMembers: number;
  canContribute: boolean;
  canEdit: boolean;
  canDelete: boolean;
  editMode: boolean;
  onToggle: (itemId: string) => void;
  onEdit: (item: PotluckItemType) => void;
  onDelete: (itemId: string) => void;
  isPending: boolean;
};

function formatBringerName(
  user: { name?: string | null; email?: string | null } | null | undefined,
  isCurrentUser: boolean,
): string {
  if (isCurrentUser) return "Vous";
  return user?.name || user?.email?.split("@")[0] || "Quelqu'un";
}

function getDensity(bringersCount: number, totalMembers: number): string {
  if (totalMembers === 0) return "0%";
  const percentage = Math.min((bringersCount / totalMembers) * 100, 100);
  return `${percentage}%`;
}

export function PotluckItem({
  item,
  currentUserId,
  totalMembers,
  canContribute,
  canEdit,
  canDelete,
  editMode,
  onToggle,
  onEdit,
  onDelete,
  isPending,
}: PotluckItemProps) {
  const currentUserBrings = item.bringers.some((bringer) => bringer.userId === currentUserId);
  const bringersCount = item.bringers.length;
  const densityWidth = getDensity(bringersCount, totalMembers);

  const bringersLabel = item.bringers
    .map((bringer) => formatBringerName(bringer.user, bringer.userId === currentUserId))
    .join(", ");

  const handleClick = () => {
    if (isPending) return;

    if (editMode && canEdit) {
      onEdit(item);
    } else if (canContribute && currentUserId) {
      onToggle(item.id);
    }
  };

  const isClickable = editMode ? canEdit : canContribute && !!currentUserId;
  const isDisabled = isPending || !isClickable;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border py-1 pl-2 transition-all",
        currentUserBrings && "border-primary bg-primary/5",
        !editMode && isClickable && "hover:border-primary/50",
        editMode && canEdit && "hover:bg-accent/50",
      )}
    >
      <motion.div
        className="bg-primary/20 absolute bottom-0 left-0 h-1 rounded-bl-lg"
        initial={{ width: 0 }}
        animate={{ width: densityWidth }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "min-w-0 flex-1 text-left transition-opacity",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isClickable && "cursor-pointer",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium">{item.label}</div>
            {item.note ? <div className="text-muted-foreground mt-1 text-sm">{item.note}</div> : null}
          </div>

          <div className="text-muted-foreground shrink-0 pr-2 text-sm">
            {bringersCount > 0 ? (
              <span title={bringersLabel}>
                {bringersCount} {bringersCount === 1 ? "personne" : "personnes"}
              </span>
            ) : (
              <span className="text-muted-foreground/50">Personne</span>
            )}
          </div>
        </div>
      </button>

      {editMode && (canEdit || canDelete) ? (
        <div className="flex shrink-0 items-center gap-1 pr-2">
          {canEdit ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(item);
              }}
              disabled={isPending}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Modifier</span>
            </Button>
          ) : null}

          {canDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  onClick={(event) => event.stopPropagation()}
                  className="text-destructive hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. L&apos;élément &quot;{item.label}&quot; sera supprimé définitivement.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(item.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
