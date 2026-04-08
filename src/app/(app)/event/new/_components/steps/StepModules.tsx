"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventGiftMode } from "@prisma/client";
import {
  CalendarDays,
  Check,
  Gift,
  Plus,
  Sparkles,
  Users,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ModuleRecommendation } from "./moduleRecommendations";
import { StepHeading } from "./StepHeading";

type GiftChoice = EventGiftMode;
type ModuleCardId = "gifts" | "secretSanta" | "bring" | "timeline";

type ModuleCatalogCard = {
  id: ModuleCardId;
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
};

type SelectedModule = {
  id: ModuleCardId;
  title: string;
  icon: LucideIcon;
  onRemove: () => void;
};

type Props = {
  giftMode: EventGiftMode | null;
  giftRecommendation: ModuleRecommendation | null;
  secretSantaEnabled: boolean;
  secretSantaRecommendation: ModuleRecommendation | null;
  bringRecommendation: ModuleRecommendation | null;
  timelineRecommendation: ModuleRecommendation | null;
  onChangeGiftMode: (giftMode: EventGiftMode) => void;
  onRemoveGifts: () => void;
  onChangeSecretSantaEnabled: (enabled: boolean) => void;
  bringEnabled: boolean;
  onChangeBringEnabled: (enabled: boolean) => void;
  timelineEnabled: boolean;
  onChangeTimelineEnabled: (enabled: boolean) => void;
};

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

function scrollTo(id: string) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function RecommendedBadge() {
  return (
    <Badge className="border-primary/20 bg-primary/10 text-primary shadow-none hover:bg-primary/10">
      Recommandé
    </Badge>
  );
}

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

function SelectedModulesStrip({ modules }: { modules: SelectedModule[] }) {
  if (modules.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="font-medium">Modules actifs</span>
        <span className="text-muted-foreground">{modules.length}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <div
              key={module.id}
              className="bg-background flex items-center gap-2 rounded-xl border px-3 py-2"
            >
              <Icon className="text-primary h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{module.title}</span>
              <Check className="text-primary h-4 w-4 shrink-0" />
              <button
                type="button"
                onClick={module.onRemove}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                aria-label={`Retirer ${module.title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleDiscoveryList({
  modules,
  recommendedIds,
}: {
  modules: ModuleCatalogCard[];
  recommendedIds: Set<ModuleCardId>;
}) {
  if (modules.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-sm">Ajouter des modules</span>
        <div className="bg-border h-px flex-1" />
      </div>

      <div className="divide-border rounded-2xl border">
        {modules.map((module, index) => {
          const Icon = module.icon;
          const recommended = recommendedIds.has(module.id);

          return (
            <div
              key={module.id}
              className={[
                "flex items-center gap-3 p-4",
                index > 0 ? "border-t" : "",
              ].join(" ")}
            >
              <div className="bg-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border">
                <Icon className="text-primary h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{module.title}</span>
                  {recommended ? <RecommendedBadge /> : null}
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{module.description}</p>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={module.onClick}
                className="text-primary hover:text-primary shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StepModules({
  giftMode,
  giftRecommendation,
  secretSantaEnabled,
  secretSantaRecommendation,
  bringRecommendation,
  timelineRecommendation,
  onChangeGiftMode,
  onRemoveGifts,
  onChangeSecretSantaEnabled,
  bringEnabled,
  onChangeBringEnabled,
  timelineEnabled,
  onChangeTimelineEnabled,
}: Props) {
  const giftsEnabled = giftMode !== null;

  const selectedModules: SelectedModule[] = [
    ...(giftsEnabled
      ? [
          {
            id: "gifts",
            title: "Cadeaux",
            icon: Gift,
            onRemove: onRemoveGifts,
          } satisfies SelectedModule,
        ]
      : []),
    ...(secretSantaEnabled
      ? [
          {
            id: "secretSanta",
            title: "Secret Santa",
            icon: Sparkles,
            onRemove: () => onChangeSecretSantaEnabled(false),
          } satisfies SelectedModule,
        ]
      : []),
    ...(bringEnabled
      ? [
          {
            id: "bring",
            title: "Qui ramene quoi",
            icon: UtensilsCrossed,
            onRemove: () => onChangeBringEnabled(false),
          } satisfies SelectedModule,
        ]
      : []),
    ...(timelineEnabled
      ? [
          {
            id: "timeline",
            title: "Programme",
            icon: CalendarDays,
            onRemove: () => onChangeTimelineEnabled(false),
          } satisfies SelectedModule,
        ]
      : []),
  ];

  const inactiveModules: ModuleCatalogCard[] = [
    ...(!giftsEnabled
      ? [
          {
            id: "gifts",
            title: "Cadeaux",
            description: "Listes et reservations sans reveler qui reserve quoi.",
            icon: Gift,
            onClick: () => {
              onChangeGiftMode("HOST_LIST");
              scrollTo("module-gifts");
            },
          } satisfies ModuleCatalogCard,
        ]
      : []),
    ...(!secretSantaEnabled
      ? [
          {
            id: "secretSanta",
            title: "Secret Santa",
            description: "Tirage au sort et attributions privees.",
            icon: Sparkles,
            onClick: () => onChangeSecretSantaEnabled(true),
          } satisfies ModuleCatalogCard,
        ]
      : []),
    ...(!bringEnabled
      ? [
          {
            id: "bring",
            title: "Qui ramene quoi",
            description: "Boissons, snacks et materiel repartis entre les participants.",
            icon: UtensilsCrossed,
            onClick: () => onChangeBringEnabled(true),
          } satisfies ModuleCatalogCard,
        ]
      : []),
    ...(!timelineEnabled
      ? [
          {
            id: "timeline",
            title: "Programme",
            description: "Ajoute les temps forts de la journee dans un module dedie.",
            icon: CalendarDays,
            onClick: () => onChangeTimelineEnabled(true),
          } satisfies ModuleCatalogCard,
        ]
      : []),
  ];

  const recommendedIds = new Set<ModuleCardId>([
    ...(giftRecommendation && !giftsEnabled ? (["gifts"] as const) : []),
    ...(secretSantaRecommendation && !secretSantaEnabled
      ? (["secretSanta"] as const)
      : []),
    ...(bringRecommendation && !bringEnabled ? (["bring"] as const) : []),
    ...(timelineRecommendation && !timelineEnabled ? (["timeline"] as const) : []),
  ]);

  const rankedModules = [
    ...inactiveModules.filter((module) => recommendedIds.has(module.id)),
    ...inactiveModules.filter((module) => !recommendedIds.has(module.id)),
  ];

  return (
    <div className="space-y-4">
      <StepHeading
        title="Options"
        subtitle="Ajoute seulement les modules utiles pour cet evenement."
      />

      <SelectedModulesStrip modules={selectedModules} />

      <ModuleDiscoveryList modules={rankedModules} recommendedIds={recommendedIds} />

      {giftsEnabled ? (
        <Card id="module-gifts">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Cadeaux</CardTitle>
            <CardDescription>Choisis le mode adapté à cet événement.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {giftChoices.map((choice) => (
                <ModeCard
                  key={choice.value}
                  selected={giftMode === choice.value}
                  title={choice.title}
                  desc={choice.desc}
                  Icon={choice.Icon}
                  onSelect={() => onChangeGiftMode(choice.value)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
