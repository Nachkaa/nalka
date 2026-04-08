"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventGiftMode } from "@prisma/client";
import { Gift, Plus, Users, X, type LucideIcon } from "lucide-react";
import type { ModuleRecommendation } from "./moduleRecommendations";
import { StepHeading } from "./StepHeading";

type GiftChoice = EventGiftMode;
const giftChoices = [
  {
    value: "HOST_LIST",
    title: "Seulement ma liste",
    desc: "Une seule liste pour l'organisateur.",
    Icon: Gift,
  },
  {
    value: "PERSONAL_LISTS",
    title: "Une liste par personne",
    desc: "Chaque invite a sa propre liste.",
    Icon: Users,
  },
] satisfies ReadonlyArray<{
  value: GiftChoice;
  title: string;
  desc: string;
  Icon: LucideIcon;
}>;

function ModeCard({
  selected,
  title,
  desc,
  Icon,
  onSelect,
}: {
  selected: boolean;
  title: string;
  desc: string;
  Icon: LucideIcon;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "rounded-xl border p-4 text-left transition",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        selected ? "bg-accent text-accent-foreground" : "",
      ].join(" ")}
      role="radio"
      aria-checked={selected}
    >
      <div className="flex items-start gap-3">
        <div className="bg-background mt-0.5 rounded-lg border p-2">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="font-medium">{title}</div>
          <div className="text-muted-foreground mt-1 text-sm">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function scrollTo(id: string) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

type Props = {
  giftMode: EventGiftMode | null;
  giftRecommendation: ModuleRecommendation | null;
  onChangeGiftMode: (giftMode: EventGiftMode) => void;
  onRemoveGifts: () => void;

  bringEnabled: boolean;
  onChangeBringEnabled: (enabled: boolean) => void;
  timelineEnabled: boolean;
  onChangeTimelineEnabled: (enabled: boolean) => void;
};

type AddTile = {
  id: "bring" | "timeline";
  title: string;
  description: string;
  onClick: () => void;
};

export function StepModules({
  giftMode,
  giftRecommendation,
  onChangeGiftMode,
  onRemoveGifts,
  bringEnabled,
  onChangeBringEnabled,
  timelineEnabled,
  onChangeTimelineEnabled,
}: Props) {
  const giftsEnabled = giftMode !== null;
  const giftsAutoAdded = giftsEnabled && giftRecommendation?.autoAdded === true;
  const giftsRecommended = giftRecommendation?.suggested === true && !giftsAutoAdded;

  const tiles: AddTile[] = [
    ...(!bringEnabled
      ? [
          {
            id: "bring",
            title: "Qui ramene quoi",
            description: "Boissons, snacks, materiel assignes aux participants.",
            onClick: () => {
              onChangeBringEnabled(true);
              scrollTo("module-bring");
            },
          } satisfies AddTile,
        ]
      : []),

    ...(!timelineEnabled
      ? [
          {
            id: "timeline",
            title: "Programme",
            description: "Ajoute les temps forts de la journée dans un module dédié.",
            onClick: () => {
              onChangeTimelineEnabled(true);
              scrollTo("module-timeline");
            },
          } satisfies AddTile,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {giftMode ? <input type="hidden" name="giftMode" value={giftMode} /> : null}
      {bringEnabled ? <input type="hidden" name="modules.bringEnabled" value="on" /> : null}
      <StepHeading
        title="Options"
        subtitle="Ajoute des modules. Tu pourras affiner les reglages plus tard."
      />

      <Card id="module-gifts">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Cadeaux</CardTitle>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {giftsAutoAdded ? <Badge variant="secondary">Ajouté automatiquement</Badge> : null}
              {giftsRecommended ? <Badge variant="secondary">Recommandé</Badge> : null}
              {giftsEnabled && !giftsAutoAdded ? <Badge variant="secondary">Ajouté</Badge> : null}
            </div>
          </div>
          <CardDescription>
            {giftsAutoAdded
              ? "Tu peux le retirer si ce n’est pas utile."
              : giftsRecommended
                ? "Recommandé pour cet événement."
                : "Ajoute ce module si tu veux gérer des listes et réservations."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {giftRecommendation ? (
            <div className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-sm">
              {giftRecommendation.reason}
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            {giftChoices.map((c) => (
              <ModeCard
                key={c.value}
                selected={giftMode === c.value}
                title={c.title}
                desc={c.desc}
                Icon={c.Icon}
                onSelect={() => onChangeGiftMode(c.value)}
              />
            ))}
          </div>

          {giftsEnabled ? (
            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={onRemoveGifts}>
                <X className="mr-2 h-4 w-4" />
                Retirer Cadeaux
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {tiles.length > 0 ? (
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Ajouter un module</CardTitle>
            </div>
            <CardDescription>Clique pour ajouter. Tu peux retirer a tout moment.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            {tiles.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={t.onClick}
                className={[
                  "w-full rounded-xl border p-4 text-left transition",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">{t.title}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">{t.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {bringEnabled && (
        <Card id="module-bring">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Qui ramene quoi</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Retirer le module qui ramene quoi"
                onClick={() => onChangeBringEnabled(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Actif. Configuration detaillee apres creation.</CardDescription>
          </CardHeader>

          <CardContent className="text-muted-foreground text-sm">
            Tu pourras definir les elements et assignations dans la page evenement.
          </CardContent>
        </Card>
      )}

      {timelineEnabled && (
        <Card id="module-timeline">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Programme</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Retirer le module programme"
                onClick={() => onChangeTimelineEnabled(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Actif. Tu créeras les moments ensuite dans l’événement.</CardDescription>
          </CardHeader>

          <CardContent className="text-muted-foreground text-sm">
            Utilise ce module pour partager le déroulé de la journée avec les invités.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
