"use client";

import { createEvent } from "@/app/(app)/event/actions";
import { Button } from "@/components/ui/button";
import { saveAnonymousEventDraft } from "@/features/events/event-draft-actions";
import {
  EventModuleKey,
  type EventGiftMode,
  type EventLocationMode,
  type EventScheduleMode,
} from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
  secretSantaEnabled: boolean;
  bringEnabled: boolean;
  timelineEnabled: boolean;
  budgetEnabled: boolean;
};

type Props = {
  displayName: string;
  isAuthenticated: boolean;
};

type StepDef = {
  key: "type" | "title" | "date" | "place" | "modules" | "review";
  chip: string;
  title: string;
};

export const STEPS: readonly StepDef[] = [
  { key: "type", chip: "Type", title: "Type d'événement" },
  { key: "title", chip: "Titre", title: "Nom de l’événement" },
  { key: "date", chip: "Date", title: "Quand ?" },
  { key: "place", chip: "Lieu", title: "Où ?" },
  { key: "modules", chip: "Pilotage", title: "Modules" },
  { key: "review", chip: "Récap", title: "Résumé" },
] as const;

export function EventCreateStepper({ displayName, isAuthenticated }: Props) {
  const router = useRouter();
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
    secretSantaEnabled: false,
    bringEnabled: false,
    timelineEnabled: false,
    budgetEnabled: false,
  });
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();
  const moduleRecommendations = useMemo(() => inferModuleRecommendations(draft), [draft]);
  const giftRecommendation = useMemo(
    () =>
      moduleRecommendations.recommended.find((item) => item.moduleKey === EventModuleKey.GIFTS) ??
      null,
    [moduleRecommendations],
  );
  const bringRecommendation = useMemo(
    () =>
      moduleRecommendations.recommended.find((item) => item.moduleKey === EventModuleKey.POTLUCK) ??
      null,
    [moduleRecommendations],
  );
  const secretSantaRecommendation = useMemo(
    () =>
      moduleRecommendations.recommended.find(
        (item) => item.moduleKey === EventModuleKey.SECRET_SANTA,
      ) ?? null,
    [moduleRecommendations],
  );
  const timelineRecommendation = useMemo(
    () =>
      moduleRecommendations.recommended.find((item) => item.moduleKey === EventModuleKey.TIMELINE) ??
      null,
    [moduleRecommendations],
  );

  const canNext = useMemo(() => {
    if (step === 1) return draft.title.trim().length > 0;
    if (step === 2 && draft.scheduleMode === "EXACT") return !!draft.scheduleDate;
    return true;
  }, [step, draft]);

  function next() {
    if (!canNext) return;
    setSubmitError("");
    setStep((currentStep) => Math.min(currentStep + 1, STEPS.length - 1));
  }

  function back() {
    setSubmitError("");
    setStep((currentStep) => Math.max(0, currentStep - 1));
  }

  function buildFormData() {
    const formData = new FormData();

    formData.set("title", draft.title);
    formData.set("description", draft.description);
    formData.set("schedule.mode", draft.scheduleMode);

    if (draft.scheduleMode === "EXACT") {
      formData.set("schedule.date", draft.scheduleDate);
    } else if (draft.scheduleMode === "POLL") {
      for (const date of draft.pollDates) formData.append("schedule.options", date);
    }

    formData.set("schedule.time", draft.scheduleTime);
    formData.set("location.mode", draft.locationMode);

    if (draft.locationMode === "EXACT") {
      formData.set("location.value", draft.location);
    } else if (draft.locationMode === "POLL") {
      for (const location of draft.pollLocations) formData.append("location.options", location);
    }

    if (draft.giftMode) {
      formData.set("modules.giftsEnabled", "on");
      formData.set("giftMode", draft.giftMode);
    }

    formData.set("modules.secretSantaEnabled", draft.secretSantaEnabled ? "on" : "");
    formData.set("modules.bringEnabled", draft.bringEnabled ? "on" : "");
    formData.set("modules.timelineEnabled", draft.timelineEnabled ? "on" : "");
    formData.set("modules.budgetEnabled", draft.budgetEnabled ? "on" : "");
    formData.set("rules.isNoSpoil", "on");
    formData.set("rules.isAnonReservations", "on");
    formData.set("rules.isSecondHandOk", "");
    formData.set("rules.isHandmadeOk", "");
    formData.set("rules.budgetCap", "");

    return formData;
  }

  function submit() {
    setSubmitError("");
    const formData = buildFormData();

    startTransition(async () => {
      try {
        if (isAuthenticated) {
          await createEvent(formData);
          return;
        }

        const { loginUrl } = await saveAnonymousEventDraft(formData);
        router.push(loginUrl);
      } catch {
        setSubmitError(
          "Impossible d'enregistrer cet événement pour le moment. Vérifiez les informations puis réessayez.",
        );
      }
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
              onChange={(theme) => setDraft((current) => ({ ...current, theme }))}
              onNext={next}
              autoAdvance
            />
          )}

          {step === 1 && (
            <StepTitle
              draft={draft}
              onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
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
              onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
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
              onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
              onNext={next}
              autoAdvance={false}
            />
          )}

          {step === 4 && (
            <StepModules
              giftMode={draft.giftMode}
              giftRecommendation={giftRecommendation}
              secretSantaEnabled={draft.secretSantaEnabled}
              secretSantaRecommendation={secretSantaRecommendation}
              bringRecommendation={bringRecommendation}
              timelineRecommendation={timelineRecommendation}
              budgetEnabled={draft.budgetEnabled}
              onChangeGiftMode={(giftMode) => setDraft((current) => ({ ...current, giftMode }))}
              onRemoveGifts={() => setDraft((current) => ({ ...current, giftMode: null }))}
              onChangeSecretSantaEnabled={(secretSantaEnabled) =>
                setDraft((current) => ({ ...current, secretSantaEnabled }))
              }
              bringEnabled={draft.bringEnabled}
              onChangeBringEnabled={(bringEnabled) =>
                setDraft((current) => ({ ...current, bringEnabled }))
              }
              timelineEnabled={draft.timelineEnabled}
              onChangeTimelineEnabled={(timelineEnabled) =>
                setDraft((current) => ({ ...current, timelineEnabled }))
              }
              onChangeBudgetEnabled={(budgetEnabled) =>
                setDraft((current) => ({ ...current, budgetEnabled }))
              }
            />
          )}

          {step === 5 && (
            <div className="space-y-4">
              <StepReview draft={draft} />
              {!isAuthenticated ? (
                <div className="border-primary/20 bg-primary/5 rounded-xl border px-4 py-3">
                  <p className="text-sm font-medium">Votre événement est prêt.</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Enregistrez-le puis connectez-vous. Votre compte vérifié deviendra
                    automatiquement l&apos;organisateur de cet événement.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

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
            {isPending
              ? "Enregistrement..."
              : isAuthenticated
                ? "Créer l'événement"
                : "Enregistrer mon événement"}
          </Button>
        )}
      </div>
    </section>
  );
}
