"use client";

import type { Draft } from "../EventCreateStepper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Gift, PackagePlus } from "lucide-react";
import { StepHeading } from "./StepHeading";
import { formatEventDateTime } from "@/lib/dates/format-date";

function giftLabel(mode: Draft["giftMode"]) {
  switch (mode) {
    case "HOST_LIST":
      return "Seulement ma liste";
    case "PERSONAL_LISTS":
      return "Une liste par personne";
    default:
      return null;
  }
}

function formatFrenchDate(iso?: string | null) {
  if (!iso) return null;
  // supports "YYYY-MM-DD"
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    // omit year on purpose (your requirement)
  }).format(d);
}

function StackedRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span className="text-foreground">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-1 text-base leading-snug font-medium">{value}</div>
    </div>
  );
}

export function StepReview({ draft }: { draft: Draft }) {
  const scheduleTime = draft.scheduleTime?.trim();
  const exactDate =
    draft.scheduleMode === "EXACT"
      ? formatEventDateTime(draft.scheduleDate, scheduleTime) ||
        formatFrenchDate(draft.scheduleDate) ||
        "Date à préciser"
      : null;

  let scheduleValue =
    draft.scheduleMode === "EXACT"
      ? (exactDate ?? "Date à préciser")
      : draft.scheduleMode === "POLL"
        ? `Sondage (${draft.pollDates?.length ?? 0} proposition${(draft.pollDates?.length ?? 0) > 1 ? "s" : ""})`
        : "À définir";
  if (scheduleTime && draft.scheduleMode !== "EXACT") {
    scheduleValue = `${scheduleValue} · ${scheduleTime}`;
  }

  const locationValue =
    draft.locationMode === "EXACT"
      ? draft.location?.trim()
        ? draft.location
        : "Lieu à préciser"
      : draft.locationMode === "POLL"
        ? `Sondage (${draft.pollLocations?.length ?? 0} proposition${(draft.pollLocations?.length ?? 0) > 1 ? "s" : ""})`
        : "À définir";

  const giftsValue = draft.giftMode ? giftLabel(draft.giftMode) : null;

  const modules: string[] = [];
  if (giftsValue) modules.push("Cadeaux");
  if (draft.secretSantaEnabled) modules.push("Secret Santa");
  if (draft.bringEnabled) modules.push("Qui ramène quoi");
  if (draft.timelineEnabled) modules.push("Programme");

  return (
    <div className="space-y-3">
      <StepHeading title="Résumé" subtitle="Vérifie, puis crée l’événement." />
      <Card>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-lg leading-tight font-semibold">
              {draft.title?.trim() ? draft.title : "Sans titre"}
            </div>
            {draft.description?.trim() ? (
              <div className="text-muted-foreground text-sm">{draft.description}</div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <StackedRow
              icon={<Calendar className="h-4 w-4" />}
              label="Date"
              value={scheduleValue}
            />
            <StackedRow icon={<MapPin className="h-4 w-4" />} label="Lieu" value={locationValue} />
            {giftsValue ? (
              <StackedRow icon={<Gift className="h-4 w-4" />} label="Cadeaux" value={giftsValue} />
            ) : null}
          </div>

          {modules.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <PackagePlus className="h-4 w-4" />
                <span>Modules activés</span>
              </div>
              {modules.map((m) => (
                <Badge key={m} variant="secondary">
                  {m}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Après création</CardTitle>
          <CardDescription>Tu pourras inviter les gens et compléter les détails.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <div>• Partager un lien</div>
          <div>• Inviter par e-mail</div>
          <div>• Régler les modules (cadeaux, qui ramène quoi, etc.)</div>
        </CardContent>
      </Card>
    </div>
  );
}
