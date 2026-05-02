"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pencil, Trash2, Check, X } from "lucide-react";

import { addPollOption, deletePollOption, renamePollOption } from "../server/mutations";
import type { EventPollVM } from "../types";

type Option = EventPollVM["options"][number];

function getVoters(option: Option): { name?: string | null }[] {
  return Array.isArray(option.voters) ? option.voters : [];
}

export function PollOptionsManage({
  slug,
  poll,
  isPending,
  showAddRow,
  onCloseAddRow,
}: {
  slug: string;
  poll: EventPollVM;
  isPending: boolean;
  showAddRow?: boolean;
  onCloseAddRow?: () => void;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [saving, startTransition] = React.useTransition();
  const busy = isPending || saving;

  const isOpen = poll.status === "OPEN";
  const canManage = isOpen && !isPending;

  const beginEdit = (option: Option) => {
    if (!canManage) return;
    setEditingId(option.id);
    setDraft(option.label);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const save = (option: Option) => {
    if (!canManage) return;
    const next = draft.trim();
    if (!next || next === option.label) return cancelEdit();

    startTransition(async () => {
      await renamePollOption({ slug, pollOptionId: option.id, label: next });
      cancelEdit();
      router.refresh();
    });
  };

  const remove = (option: Option) => {
    if (!canManage) return;
    startTransition(async () => {
      await deletePollOption({ slug, pollOptionId: option.id });
      router.refresh();
    });
  };

  const [creating, setCreating] = React.useState(false);
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (showAddRow && canManage) {
      setCreating(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [showAddRow, canManage]);

  const placeholder =
    poll.type === "SCHEDULE" ? "Ex: 2026-01-16" : "Ex: Le Bistrot d’Antoine, Nice…";

  const submit = async () => {
    const next = value.trim();
    if (!next) return;
    if (poll.type === "SCHEDULE" && !/^\d{4}-\d{2}-\d{2}$/.test(next)) return;

    await addPollOption({
      slug,
      pollId: poll.id,
      textValue: poll.type === "LOCATION" ? next : undefined,
      dateValue: poll.type === "SCHEDULE" ? next : undefined,
    });

    cancelCreate();
  };

  const cancelCreate = () => {
    setCreating(false);
    setValue("");
    onCloseAddRow?.();
  };

  return (
    <ul className="space-y-3">
      {creating && isOpen ? (
        <div className="bg-background rounded-xl border px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              disabled={!canManage}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setCreating(false);
                  setValue("");
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submit();
                }
              }}
            />

            <div className="flex gap-2 sm:justify-end">
              <Button type="button" variant="ghost" disabled={!canManage} onClick={cancelCreate}>
                Annuler
              </Button>

              <Button
                type="button"
                disabled={!canManage || !value.trim()}
                onClick={() => void submit()}
              >
                Ajouter
              </Button>
            </div>
          </div>

          {poll.type === "SCHEDULE" ? (
            <p className="text-muted-foreground mt-2 text-xs">Format attendu: YYYY-MM-DD</p>
          ) : null}
        </div>
      ) : null}

      {poll.options.map((option) => {
        const voters = getVoters(option);
        const isEditing = editingId === option.id;

        return (
          <li key={option.id} className={cn("bg-card rounded-xl border", "px-3 py-2 sm:px-4 sm:py-3")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      className="h-9"
                      autoFocus
                      disabled={busy}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") save(option);
                        if (event.key === "Escape") cancelEdit();
                      }}
                    />
                  ) : (
                    <div className="min-w-0">
                      <div className="truncate font-medium">{option.label}</div>
                    </div>
                  )}

                  <span className="shrink-0 rounded-sm bg-[var(--accent)]/40 px-2 py-0.5 text-[11px] font-medium">
                    {option.count} vote{option.count > 1 ? "s" : ""}
                  </span>
                </div>

                {voters.length > 0 ? (
                  <div className="text-muted-foreground mt-1 text-xs">
                    {voters
                      .map((voter) => voter.name ?? "—")
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                ) : (
                  <div className="text-muted-foreground mt-1 text-xs">
                    Aucun votant pour l’instant
                  </div>
                )}
              </div>

              {canManage ? (
                <div className="flex shrink-0 items-center gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-sm"
                        disabled={busy}
                        onClick={() => save(option)}
                        aria-label="Enregistrer"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-sm"
                        disabled={busy}
                        onClick={cancelEdit}
                        aria-label="Annuler"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-sm"
                        disabled={busy}
                        onClick={() => beginEdit(option)}
                        aria-label="Renommer"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-sm"
                            disabled={busy}
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette option ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              “{option.label}” sera retiré du sondage. Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(option)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
