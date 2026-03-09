// app/(app)/event/[slug]/_components/poll/PollOptionsManage.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
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
import { renamePollOption, deletePollOption } from "../../actions/polls";
import { addPollOption } from "../../actions/polls";

type Option = EventPollVM["options"][number];

function getVoters(o: Option): { name?: string | null }[] {
  return Array.isArray(o.voters) ? o.voters : [];
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

  const beginEdit = (o: Option) => {
    if (!canManage) return;
    setEditingId(o.id);
    setDraft(o.label);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const save = (o: Option) => {
    if (!canManage) return;
    const next = draft.trim();
    if (!next || next === o.label) return cancelEdit();

    startTransition(async () => {
      await renamePollOption({ slug, pollOptionId: o.id, label: next });
      cancelEdit();
      router.refresh();
    });
  };

  const remove = (o: Option) => {
    if (!canManage) return;
    startTransition(async () => {
      await deletePollOption({ slug, pollOptionId: o.id });
      router.refresh();
    });
  };

  const isOpen = poll.status === "OPEN";
  const canManage = isOpen && !isPending;

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
    const v = value.trim();
    if (!v) return;

    if (poll.type === "SCHEDULE" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;

    await addPollOption({
      slug,
      pollId: poll.id,
      textValue: poll.type === "LOCATION" ? v : undefined,
      dateValue: poll.type === "SCHEDULE" ? v : undefined,
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
      {creating && isOpen && (
        <div className="bg-background rounded-xl border px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              disabled={!canManage}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setCreating(false);
                  setValue("");
                }
                if (e.key === "Enter") {
                  e.preventDefault();
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

          {poll.type === "SCHEDULE" && (
            <p className="text-muted-foreground mt-2 text-xs">Format attendu: YYYY-MM-DD</p>
          )}
        </div>
      )}
      {poll.options.map((o) => {
        const voters = getVoters(o);
        const isEditing = editingId === o.id;

        return (
          <li key={o.id} className={cn("bg-card rounded-xl border", "px-3 py-2 sm:px-4 sm:py-3")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Title row */}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="h-9"
                      autoFocus
                      disabled={busy}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") save(o);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                  ) : (
                    <div className="min-w-0">
                      <div className="truncate font-medium">{o.label}</div>
                    </div>
                  )}

                  {/* votes badge */}
                  <span className="shrink-0 rounded-sm bg-[var(--accent)]/40 px-2 py-0.5 text-[11px] font-medium">
                    {o.count} vote{o.count > 1 ? "s" : ""}
                  </span>
                </div>

                {/* voters line */}
                {voters.length > 0 ? (
                  <div className="text-muted-foreground mt-1 text-xs">
                    {voters
                      .map((v) => v.name ?? "—")
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                ) : (
                  <div className="text-muted-foreground mt-1 text-xs">
                    Aucun votant pour l’instant
                  </div>
                )}
              </div>

              {/* Right actions */}
              {canManage && (
                <div className="flex shrink-0 items-center gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-sm"
                        disabled={busy}
                        onClick={() => save(o)}
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
                        onClick={() => beginEdit(o)}
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
                              “{o.label}” sera retiré du sondage. Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(o)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
