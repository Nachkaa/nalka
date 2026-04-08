"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EditorState } from "./types";
import { TimelineTimePicker } from "./TimelineTimePicker";

type TimelineMomentEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: EditorState;
  setEditor: React.Dispatch<React.SetStateAction<EditorState>>;
  eventDateLabel: string | null;
  normalizedStart: string | null;
  normalizedEnd: string | null;
  timeRangeInvalid: boolean;
  isSubmitDisabled: boolean;
  isMobile: boolean;
  startPickerOpen: boolean;
  endPickerOpen: boolean;
  onStartPickerOpenChange: (open: boolean) => void;
  onEndPickerOpenChange: (open: boolean) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSave: () => void;
};

export function TimelineMomentEditorDialog({
  open,
  onOpenChange,
  editor,
  setEditor,
  eventDateLabel,
  normalizedStart,
  normalizedEnd,
  timeRangeInvalid,
  isSubmitDisabled,
  isMobile,
  startPickerOpen,
  endPickerOpen,
  onStartPickerOpenChange,
  onEndPickerOpenChange,
  onStartChange,
  onEndChange,
  onSave,
}: TimelineMomentEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-2xl max-sm:top-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-none sm:rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {editor.mode === "create" ? "Ajouter un moment" : "Modifier le moment"}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations visibles par tous les participants.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="timeline-title">Titre *</Label>
            <Input
              id="timeline-title"
              value={editor.title}
              onChange={(e) => setEditor((current) => ({ ...current, title: e.target.value }))}
              placeholder="Ex. Cérémonie"
            />
          </div>

          <TimelineTimePicker
            id="timeline-starts-at"
            label="Début *"
            value={editor.startsAt}
            open={startPickerOpen}
            onOpenChange={onStartPickerOpenChange}
            onChange={onStartChange}
            isMobile={isMobile}
          />

          <TimelineTimePicker
            id="timeline-ends-at"
            label="Fin"
            value={editor.endsAt}
            open={endPickerOpen}
            onOpenChange={onEndPickerOpenChange}
            onChange={onEndChange}
            isMobile={isMobile}
          />

          {eventDateLabel ? (
            <p className="text-muted-foreground text-sm sm:col-span-2">
              Date de l'événement: {eventDateLabel}
            </p>
          ) : null}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="timeline-location-name">Lieu</Label>
            <Input
              id="timeline-location-name"
              value={editor.locationName}
              onChange={(e) =>
                setEditor((current) => ({ ...current, locationName: e.target.value }))
              }
              placeholder="Ex. Jardin"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="timeline-location-address">Adresse</Label>
            <Input
              id="timeline-location-address"
              value={editor.locationAddress}
              onChange={(e) =>
                setEditor((current) => ({ ...current, locationAddress: e.target.value }))
              }
              placeholder="Ex. 12 rue des Fleurs, Lyon"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="timeline-note">Note</Label>
            <Textarea
              id="timeline-note"
              value={editor.note}
              onChange={(e) => setEditor((current) => ({ ...current, note: e.target.value }))}
              placeholder="Infos utiles pour les invités"
            />
          </div>

          {normalizedStart === null || normalizedEnd === null ? (
            <p className="text-sm text-destructive sm:col-span-2">
              Saisissez une heure valide au format 24h.
            </p>
          ) : null}

          {timeRangeInvalid ? (
            <p className="text-sm text-destructive sm:col-span-2">
              L'heure de fin doit être après l'heure de début.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={onSave} disabled={isSubmitDisabled}>
            {editor.mode === "create" ? "Ajouter" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
