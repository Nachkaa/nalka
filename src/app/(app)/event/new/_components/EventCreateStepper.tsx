"use client";

import { createEvent } from "@/app/(app)/event/actions"; // adjust path
import { Button } from "@/components/ui/button";
import { EventModuleKey, type EventGiftMode, type EventLocationMode, type EventScheduleMode } from "@prisma/client";
import { useEffect, useMemo, useState, useTransition } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { StepperHeader } from "./StepperHeader";
import { StepLocation } from "./steps/StepLocation";
import { inferModuleRecommendations } from "./steps/moduleRecommendations";
import { StepModules } from "./steps/StepModules";
import { StepReview } from "./steps/StepReview";
import { StepSchedule } from "./steps/StepSchedule";
import { StepTitle } from "./steps/StepTitle";
import type { ThemeValue } from "./steps/StepType";
import { StepType } from "./steps/StepType";

export type Draft = {
  theme?: ThemeValue;
  displayName: string;
  title: string;
  description: string;
  location: string;
  locationMode: EventLocationMode;
  pollLocations: string[];
  scheduleMode: EventScheduleMode;
  scheduleDate: string;
  scheduleTime: string;
  pollDates: string[];
  giftMode: EventGiftMode | null;
  giftsTouched: boolean;
  bringEnabled: boolean;
  timelineEnabled: boolean;
};

type Props = { displayName: string };

type StepDef = {
  key: "type" | "title" | "date" | "place" | "modules" | "review";
  chip: string;
  title: string;
};

export const STEPS: readonly StepDef[] = [
  { key: "type", chip: "Type", title: "Pourquoi crées-tu cet événement ?" },
  { key: "title", chip: "Titre", title: "Nom de l’événement" },
  { key: "date", chip: "Date", title: "Quand ?" },
  { key: "place", chip: "Lieu", title: "Où ?" },
  { key: "modules", chip: "Options", title: "Modules" },
  { key: "review", chip: "Récap", title: "Résumé" },
] as const;

export function EventCreateStepper({ displayName }: Props) {
  const [draft, setDraft] = useState<Draft>({
    theme: undefined,
    displayName,
    title: "",
    description: "",
    location: "",
    scheduleMode: "EXACT",
    locationMode: "EXACT",
    pollLocations: [],
    scheduleDate: "",
    scheduleTime: "",
    pollDates: [],
    giftMode: null,
    giftsTouched: false,
    bringEnabled: false,
    timelineEnabled: false,
  });
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const giftRecommendation = useMemo(
    () =>
      inferModuleRecommendations(draft).find((item) => item.moduleKey === EventModuleKey.GIFTS) ??
      null,
    [draft],
  );

  useEffect(() => {
    setDraft((current) => {
      if (current.giftsTouched) return current;

      const shouldAutoAdd = giftRecommendation?.autoAdded === true;

      if (shouldAutoAdd && current.giftMode === null) {
        return { ...current, giftMode: "HOST_LIST" };
      }

      if (!shouldAutoAdd && current.giftMode !== null) {
        return { ...current, giftMode: null };
      }

      return current;
    });
  }, [giftRecommendation]);

  const canNext = useMemo(() => {
    if (step === 1) return draft.title.trim().length > 0;
    if (step === 2 && draft.scheduleMode === "EXACT") return !!draft.scheduleDate;
    return true;
  }, [step, draft]);

  function next() {
    if (!canNext) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function submit() {
    const fd = new FormData();

    fd.set("title", draft.title);
    fd.set("description", draft.description);

    // schedule (Prisma enums)
    fd.set("schedule.mode", draft.scheduleMode);
    if (draft.scheduleMode === "EXACT") {
      fd.set("schedule.date", draft.scheduleDate);
    } else if (draft.scheduleMode === "POLL") {
      for (const d of draft.pollDates) fd.append("schedule.options", d);
    }

    fd.set("schedule.time", draft.scheduleTime);

    // location (Prisma enums)
    fd.set("location.mode", draft.locationMode);
    if (draft.locationMode === "EXACT") {
      fd.set("location.value", draft.location);
    } else if (draft.locationMode === "POLL") {
      for (const l of draft.pollLocations) fd.append("location.options", l);
    }

    // gifts (Prisma enum string)
    if (draft.giftMode) {
      fd.set("modules.giftsEnabled", "on");
      fd.set("giftMode", draft.giftMode);
    }

    // modules
    fd.set("modules.bringEnabled", draft.bringEnabled ? "on" : "");
    fd.set("modules.timelineEnabled", draft.timelineEnabled ? "on" : "");

    // rules (for now you hard-force defaults)
    fd.set("rules.isNoSpoil", "on");
    fd.set("rules.isAnonReservations", "on");
    fd.set("rules.isSecondHandOk", "");
    fd.set("rules.isHandmadeOk", "");
    fd.set("rules.budgetCap", "");

    startTransition(async () => {
      await createEvent(fd);
    });
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6">
      <StepperHeader
        steps={STEPS}
        step={step}
        withinStep={canNext ? 0.8 : 0.3}
        disabled={isPending}
        onStepChange={setStep}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {step === 0 && (
            <StepType
              value={draft.theme}
              onChange={(theme) => setDraft((d) => ({ ...d, theme }))}
              onNext={next}
              autoAdvance
            />
          )}

          {step === 1 && (
            <StepTitle
              draft={draft}
              onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
              onNext={next}
              autoAdvance={false}
            />
          )}

          {step === 2 && (
            <StepSchedule
              mode={draft.scheduleMode}
              date={draft.scheduleDate}
              pollDates={draft.pollDates}
              time={draft.scheduleTime}
              onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
              onNext={next}
              autoAdvance={draft.scheduleMode === "EXACT"}
            />
          )}

          {step === 3 && (
            <StepLocation
              mode={draft.locationMode}
              location={draft.location}
              pollLocations={draft.pollLocations}
              theme={draft.theme}
              displayName={displayName}
              onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
              onNext={next}
              autoAdvance={false}
            />
          )}

          {step === 4 && (
            <StepModules
              giftMode={draft.giftMode}
              giftRecommendation={giftRecommendation}
              onChangeGiftMode={(giftMode) =>
                setDraft((d) => ({ ...d, giftMode, giftsTouched: true }))
              }
              onRemoveGifts={() => setDraft((d) => ({ ...d, giftMode: null, giftsTouched: true }))}
              bringEnabled={draft.bringEnabled}
              onChangeBringEnabled={(bringEnabled) => setDraft((d) => ({ ...d, bringEnabled }))}
              timelineEnabled={draft.timelineEnabled}
              onChangeTimelineEnabled={(timelineEnabled) =>
                setDraft((d) => ({ ...d, timelineEnabled }))
              }
            />
          )}

          {step === 5 && <StepReview draft={draft} />}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={back} disabled={step === 0 || isPending}>
          Retour
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next} disabled={!canNext || isPending}>
            Continuer
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={isPending || !draft.title.trim()}>
            Créer l’événement
          </Button>
        )}
      </div>
    </section>
  );
}
