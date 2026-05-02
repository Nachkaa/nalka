"use client";

import type { ComponentType } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  buildDateTimeFromEventDate,
  buildEditorState,
  formatEventDateLabel,
  getLiveMoments,
  getLiveSummary,
  groupLiveMomentsByDay,
  normalizeMomentTitle,
  normalizeTimeInput,
  toInputTime,
} from "../lib/timeline-utils";
import {
  createTimelineMoment,
  deleteTimelineMoment,
  updateTimelineMoment,
} from "../server/mutations";
import type {
  EditorState,
  LiveTimelineMoment,
  MomentSuggestion,
  TimelineModuleProps,
  TimelineMoment,
} from "../types";
import { getMomentSuggestions } from "../lib/timeline-suggestions";
import { TimelineMomentEditorDialog } from "./TimelineMomentEditorDialog";
import { TimelineMomentList } from "./TimelineMomentList";
import { TimelineSummaryCard } from "./TimelineSummaryCard";

type TimelineDateSetupEntryPointProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slug: string;
  initialDate?: string | null;
  schedulePoll?: TimelineModuleProps["schedulePoll"];
  meId: string;
  enabled?: boolean;
};

type TimelineScreenProps = TimelineModuleProps & {
  DateSetupEntryPointComponent?: ComponentType<TimelineDateSetupEntryPointProps>;
};

export function TimelineScreen({
  eventId,
  slug,
  canEdit,
  meId,
  eventDate,
  eventTitle,
  schedulePoll,
  moments,
  programmeLive,
  DateSetupEntryPointComponent,
}: TimelineScreenProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(() => buildEditorState("create"));
  const [deleteTarget, setDeleteTarget] = useState<TimelineMoment | null>(null);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dateSetupOpen, setDateSetupOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const liveMomentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasAutoScrolledRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const liveMoments = useMemo(
    () =>
      getLiveMoments(moments, {
        currentMomentId: programmeLive?.currentMoment?.id ?? null,
        nextMomentId: programmeLive?.nextMoment?.id ?? null,
      }),
    [moments, programmeLive?.currentMoment?.id, programmeLive?.nextMoment?.id],
  );
  const liveSummary = useMemo(() => getLiveSummary(liveMoments), [liveMoments]);
  const groups = useMemo(() => groupLiveMomentsByDay(liveMoments), [liveMoments]);
  const eventDateLabel = useMemo(() => formatEventDateLabel(eventDate), [eventDate]);
  const suggestions = useMemo(() => getMomentSuggestions(eventTitle), [eventTitle]);
  const visibleSuggestions = useMemo(() => {
    const usedTitles = new Set(moments.map((moment) => normalizeMomentTitle(moment.title)));
    return suggestions.filter((suggestion) => !usedTitles.has(normalizeMomentTitle(suggestion.title)));
  }, [moments, suggestions]);

  const normalizedStart = normalizeTimeInput(editor.startsAt);
  const normalizedEnd = normalizeTimeInput(editor.endsAt);
  const timeRangeInvalid =
    normalizedStart !== null &&
    normalizedStart !== "" &&
    normalizedEnd !== null &&
    normalizedEnd !== "" &&
    normalizedEnd <= normalizedStart;
  const isDateMissing = !eventDate;
  const hasUnresolvedDatePoll = isDateMissing && Boolean(schedulePoll);
  const isSubmitDisabled =
    isPending ||
    !editor.title.trim() ||
    !normalizedStart ||
    timeRangeInvalid ||
    !eventDate;

  useEffect(() => {
    if (hasAutoScrolledRef.current || isDateMissing) return;

    const target =
      liveMoments.find((moment) => moment.state === "current") ??
      liveMoments.find((moment) => moment.state === "next") ??
      null;

    if (!target) {
      hasAutoScrolledRef.current = true;
      return;
    }

    const frame = requestAnimationFrame(() => {
      liveMomentRefs.current[target.id]?.scrollIntoView({ block: "center", behavior: "smooth" });
      hasAutoScrolledRef.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [isDateMissing, liveMoments]);

  const updateStartTime = (startsAt: string) => {
    setEditor((current) => ({
      ...current,
      startsAt,
    }));
  };

  const openCreate = (preset?: MomentSuggestion) => {
    if (isDateMissing) return;

    const previousEnd = moments.length > 0 ? moments[moments.length - 1]?.endsAt : null;
    const defaultStart = previousEnd ? toInputTime(previousEnd) : "";

    setEditor({
      ...buildEditorState("create", undefined, preset),
      startsAt: defaultStart,
      endsAt: "",
    });
    setEditorOpen(true);
    setStartPickerOpen(false);
    setEndPickerOpen(false);
  };

  const openEdit = (moment: LiveTimelineMoment) => {
    if (isDateMissing) return;

    setEditor(buildEditorState("edit", moment));
    setEditorOpen(true);
    setStartPickerOpen(false);
    setEndPickerOpen(false);
  };

  const handleSave = () => {
    if (!normalizedStart) return;

    const startsAt = buildDateTimeFromEventDate(eventDate, normalizedStart);
    const endsAt = normalizedEnd ? buildDateTimeFromEventDate(eventDate, normalizedEnd) : "";

    startTransition(async () => {
      const payload = {
        eventId,
        slug,
        momentId: editor.momentId,
        title: editor.title,
        kind: editor.kind,
        startsAt,
        endsAt,
        locationName: editor.locationName,
        locationAddress: editor.locationAddress,
        note: editor.note,
      };

      const result =
        editor.mode === "create"
          ? await createTimelineMoment(payload)
          : await updateTimelineMoment(payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(editor.mode === "create" ? "Moment ajouté" : "Moment mis à jour");
      setEditorOpen(false);
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteTimelineMoment({
        eventId,
        slug,
        momentId: deleteTarget.id,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Moment supprimé");
      setDeleteTarget(null);
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-foreground text-2xl font-semibold">Programme</h2>

          {canEdit && moments.length > 0 ? (
            <Button
              type="button"
              onClick={() => {
                if (isDateMissing) {
                  setDateSetupOpen(true);
                  return;
                }
                openCreate();
              }}
              disabled={isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un moment
            </Button>
          ) : null}
        </div>

        {canEdit && isDateMissing ? (
          <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {hasUnresolvedDatePoll
                  ? "Choisissez d’abord une date finale pour créer le programme."
                  : "Définissez d’abord la date de l’événement pour ajouter des moments au programme."}
              </p>
              <div>
                <Button type="button" onClick={() => setDateSetupOpen(true)}>
                  Définir la date
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {!isDateMissing && canEdit && moments.length > 0 && visibleSuggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleSuggestions.map((suggestion) => (
              <Button
                key={suggestion.title}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openCreate(suggestion)}
              >
                {suggestion.title}
              </Button>
            ))}
          </div>
        ) : null}

        {moments.length === 0 && !isDateMissing ? (
          canEdit ? (
            <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Créez votre programme</h2>
                  <p className="text-muted-foreground text-sm">
                    Ajoutez les différents temps forts de votre journée.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    Suggestions pour cet événement
                  </p>
                  {visibleSuggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {visibleSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion.title}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openCreate(suggestion)}
                        >
                          {suggestion.title}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <Button type="button" onClick={() => openCreate()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un moment
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-border bg-card text-muted-foreground rounded-2xl border p-6 text-sm shadow-sm">
              Le programme n’a pas encore été partagé.
            </div>
          )
        ) : !isDateMissing ? (
          <div className="space-y-6">
            <TimelineSummaryCard summary={liveSummary} />
            <TimelineMomentList
              groups={groups}
              canEdit={canEdit}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              liveMomentRefs={liveMomentRefs}
            />
          </div>
        ) : null}
      </div>

      {DateSetupEntryPointComponent ? (
        <DateSetupEntryPointComponent
          open={dateSetupOpen}
          onOpenChange={setDateSetupOpen}
          eventId={eventId}
          slug={slug}
          initialDate={eventDate}
          schedulePoll={schedulePoll ?? null}
          meId={meId}
          enabled={canEdit}
        />
      ) : null}

      <TimelineMomentEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editor={editor}
        setEditor={setEditor}
        eventDateLabel={eventDateLabel}
        normalizedStart={normalizedStart}
        normalizedEnd={normalizedEnd}
        timeRangeInvalid={timeRangeInvalid}
        isSubmitDisabled={isSubmitDisabled}
        isMobile={isMobile}
        startPickerOpen={startPickerOpen}
        endPickerOpen={endPickerOpen}
        onStartPickerOpenChange={setStartPickerOpen}
        onEndPickerOpenChange={setEndPickerOpen}
        onStartChange={updateStartTime}
        onEndChange={(endsAt) => setEditor((current) => ({ ...current, endsAt }))}
        onSave={handleSave}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce moment ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retire définitivement ce moment du programme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
