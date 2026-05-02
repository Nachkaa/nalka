"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { UpdateDescriptionAction } from "../types";

type Props = {
  eventId: string;
  slug: string;
  description: string | null;
  canEdit: boolean;
  onSaveDescription: UpdateDescriptionAction;
};

export function EventDescriptionSection({
  eventId,
  slug,
  description,
  canEdit,
  onSaveDescription,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(description || "");
  const [isPending, startTransition] = useTransition();

  if (!description && !canEdit) return null;

  const handleSave = () => {
    startTransition(async () => {
      const result = await onSaveDescription(eventId, slug, value);

      if (result.success) {
        toast.success("Description mise à jour");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    });
  };

  const handleCancel = () => {
    setValue(description || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <section className="space-y-3 pb-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-foreground text-base font-medium">À propos de l&apos;événement</h2>
        </div>

        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Décrivez votre événement..."
          rows={6}
          maxLength={1000}
          disabled={isPending}
          className="resize-none text-sm"
          autoFocus
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">{value.length} / 1000 caractères</span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Annuler</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isPending || value === description}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                  <span className="hidden sm:inline">Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Enregistrer</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-foreground text-base font-medium">À propos de l&apos;événement</h2>

          {description ? (
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          ) : (
            <p className="text-muted-foreground/70 text-sm italic">
              Aucune description pour le moment
            </p>
          )}
        </div>

        {canEdit ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="shrink-0">
            <Pencil className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Modifier</span>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
