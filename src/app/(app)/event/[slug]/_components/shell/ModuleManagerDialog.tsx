"use client";

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
import { EventGiftMode, EventModuleKey } from "@prisma/client";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Check,
  ChevronLeft,
  Gift,
  Lock,
  MessageSquare,
  PiggyBank,
  Settings2,
  Sparkles,
  Trash2,
  User,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { buildEventModulePath } from "@/features/events/module-navigation";
import type {
  EventModuleRouteKey,
  EventModuleSnapshot,
} from "@/features/events/shell-navigation";
import {
  getEventModuleDefinition,
  listModuleManagerDefinitions,
  type EventModuleDefinition,
} from "@/features/events/module-registry";
import { cn } from "@/lib/utils";

import {
  disableEventModule,
  enableEventModule,
  updateGiftsModuleConfig,
} from "../../actions/modules";

type ModuleManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: EventModuleSnapshot[];
  eventId: string;
  eventSlug: string;
  giftMode: EventGiftMode;
  requestedConfigKey?: EventModuleKey | null;
};

type CatalogEntry = EventModuleDefinition & {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const MODULE_ICONS: Record<
  EventModuleKey,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  OVERVIEW: Settings2,
  GIFTS: Gift,
  SECRET_SANTA: Sparkles,
  POTLUCK: UtensilsCrossed,
  TIMELINE: CalendarClock,
  BUDGET: PiggyBank,
  POLLS: BarChart3,
  CHAT: MessageSquare,
};

const MODULE_CATALOG: CatalogEntry[] = listModuleManagerDefinitions().map((definition) => ({
  ...definition,
  icon: MODULE_ICONS[definition.key],
}));

type View = { screen: "catalog" } | { screen: "config"; key: EventModuleKey };

export function ModuleManagerDialog({
  open,
  onOpenChange,
  modules,
  eventId,
  eventSlug,
  giftMode,
  requestedConfigKey = null,
}: ModuleManagerDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState<View>({ screen: "catalog" });

  const giftModule = useMemo(() => modules.find((m) => m.key === EventModuleKey.GIFTS), [modules]);
  const isGiftsConfigured = Boolean(giftModule?.giftsSettings);
  const initialGiftMode = useMemo(
    () =>
      isGiftsConfigured &&
      (giftMode === EventGiftMode.HOST_LIST || giftMode === EventGiftMode.PERSONAL_LISTS)
        ? giftMode
        : null,
    [giftMode, isGiftsConfigured],
  );

  const addedKeys = useMemo(
    () => new Set(modules.filter((m) => m.enabled).map((m) => m.key)),
    [modules],
  );

  const installed = useMemo(() => MODULE_CATALOG.filter((m) => addedKeys.has(m.key)), [addedKeys]);

  const available = useMemo(
    () =>
      MODULE_CATALOG.filter(
        (moduleDefinition) =>
          !addedKeys.has(moduleDefinition.key) &&
          moduleDefinition.managerAvailability === "available",
      ),
    [addedKeys],
  );

  const comingSoon = useMemo(
    () =>
      MODULE_CATALOG.filter(
        (moduleDefinition) => moduleDefinition.managerAvailability === "coming-soon",
      ),
    [],
  );

  const close = () => {
    onOpenChange(false);
    setView({ screen: "catalog" });
  };

  useEffect(() => {
    if (open && requestedConfigKey) {
      setView({ screen: "config", key: requestedConfigKey });
    }
  }, [open, requestedConfigKey]);

  const goToTab = (key: EventModuleKey) => {
    const routeKey: EventModuleRouteKey = getEventModuleDefinition(key)?.navigationKey ?? "overview";
    router.push(buildEventModulePath(eventSlug, routeKey));
  };

  const handleEnable = (key: EventModuleKey) => {
    if (isPending) return;

    startTransition(async () => {
      const res = await enableEventModule({ eventId, slug: eventSlug, key });
      if (!res.ok) {
        toast.error(res.error ?? "Impossible d'activer le module");
        return;
      }

      if (key === EventModuleKey.GIFTS && !isGiftsConfigured) {
        setView({ screen: "config", key: EventModuleKey.GIFTS });
        goToTab(key);
        router.refresh();
        toast.success("Module activ�. Choisissez maintenant le mode des cadeaux.");
        return;
      }

      close();
      goToTab(key);
      router.refresh();
      toast.success("Module activé !");
    });
  };

  const handleDisable = (key: EventModuleKey) => {
    if (isPending) return;

    startTransition(async () => {
      const res = await disableEventModule({ eventId, slug: eventSlug, key });
      if (!res.ok) {
        toast.error(res.error ?? "Impossible de désactiver le module");
        return;
      }

      // keep dialog open so user sees the list update
      router.refresh();
      toast.success("Module désactivé.");
    });
  };

  const header = useMemo(() => {
    if (view.screen === "catalog") {
      return {
        title: "Gérer les modules",
        desc: "Activez, désactivez et configurez les modules de votre événement.",
      };
    }
    return {
      title: "Configuration",
    };
  }, [view]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setView({ screen: "catalog" });
      }}
    >
      <DialogContent className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 overflow-hidden p-0 sm:h-auto sm:max-h-[min(90vh,48rem)] sm:max-w-3xl sm:gap-4 sm:p-6">
        <DialogHeader className="shrink-0 gap-1 border-b px-4 py-4 sm:border-b-0 sm:px-0 sm:py-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle>{header.title}</DialogTitle>
              <DialogDescription>{header.desc}</DialogDescription>
            </div>

            {view.screen === "config" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => setView({ screen: "catalog" })}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Retour
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-0">
          {view.screen === "catalog" ? (
            <div className="space-y-6 pb-1">
            {/* Installés */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-sm font-semibold">Modules activés</h3>
              </div>

              {installed.length === 0 ? (
                <div className="bg-muted/20 text-muted-foreground rounded-xl border p-4 text-sm">
                  Aucun module installé pour le moment.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {installed.map((item) => (
                    <ModuleCard
                      key={item.key}
                      item={item}
                      state="installed"
                      disabled={isPending}
                      onConfigure={() => setView({ screen: "config", key: item.key })}
                      onDisable={() => handleDisable(item.key)}
                      onOpenModule={() => {
                        close();
                        goToTab(item.key);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Disponibles */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-sm font-semibold">Modules disponibles</h3>
              </div>

              {available.length === 0 ? (
                <div className="bg-muted/20 text-muted-foreground rounded-xl border p-4 text-sm">
                  Tous les modules disponibles sont déjà installés.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {available.map((item) => (
                    <ModuleCard
                      key={item.key}
                      item={item}
                      state="available"
                      disabled={isPending}
                      onEnable={() => handleEnable(item.key)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Bientôt */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-sm font-semibold">Bientôt</h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {comingSoon.map((item) => (
                  <ModuleCard key={item.key} item={item} state="soon" disabled />
                ))}
              </div>
            </section>
            </div>
          ) : view.key === EventModuleKey.GIFTS ? (
            <GiftsModuleConfig
              eventId={eventId}
              eventSlug={eventSlug}
              initialMode={initialGiftMode}
              initialSettings={{
                isAnonReservations: giftModule?.giftsSettings?.isAnonReservations ?? true,
                isNoSpoil: giftModule?.giftsSettings?.isNoSpoil ?? true,
              }}
              onCancel={() => close()}
              onSaved={() => {
                close();
                router.refresh();
              }}
            />
          ) : (
            <ModuleConfigPlaceholder
              moduleKey={view.key}
              onOpenModule={() => {
                close();
                goToTab(view.key);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ModuleCard.tsx

function ModuleCard(props: {
  item: CatalogEntry;
  state: "installed" | "available" | "soon";
  disabled?: boolean;
  onEnable?: () => void;
  onConfigure?: () => void;
  onOpenModule?: () => void;
  onDisable?: () => void;
}) {
  const { item, state, disabled, onEnable, onConfigure, onDisable } = props;
  const Icon = item.icon;

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  const HAS_CONFIG: Partial<Record<EventModuleKey, boolean>> = {
    [EventModuleKey.GIFTS]: true,
    [EventModuleKey.TIMELINE]: true,
  };

  const canConfigure = Boolean(HAS_CONFIG[item.key]);
  // ModuleCard.tsx
  const canDisable = state === "installed" && typeof onDisable === "function";

  return (
    <>
      <div
        className={cn(
          "bg-muted/20 flex h-full w-full gap-3 rounded-xl border p-4",
          disabled && "opacity-80",
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--primary-700)] shadow-sm">
          <Icon className="h-5 w-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-foreground truncate font-semibold">{item.label}</span>

                {state === "installed" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}

                {state === "soon" ? (
                  <span className="border-border text-muted-foreground inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[11px] font-semibold">
                    <Lock className="h-3 w-3" aria-hidden />
                    Bientôt
                  </span>
                ) : null}
              </div>

              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-snug">
                {item.description}
              </p>
            </div>

            {canDisable ? (
              <div className="shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-8 w-8"
                  aria-label={`Désactiver ${item.label}`}
                  disabled={disabled}
                  onClick={() => setConfirmDisableOpen(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {state === "available" ? (
              <Button type="button" size="sm" onClick={onEnable} disabled={disabled}>
                Activer
              </Button>
            ) : null}

            {state === "installed" && canConfigure ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onConfigure}
                disabled={disabled}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Configurer
              </Button>
            ) : null}

            {state === "soon" ? (
              <Button type="button" size="sm" variant="outline" disabled>
                Indisponible
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* confirm dialog OUTSIDE the dropdown */}
      <AlertDialog open={confirmDisableOpen} onOpenChange={setConfirmDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver “{item.label}” ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le module sera masqué pour tous. Les données existantes seront conservées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDisable?.();
                setConfirmDisableOpen(false);
              }}
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type GiftsModuleConfigProps = {
  eventId: string;
  eventSlug: string;
  initialMode: EventGiftMode | null;
  initialSettings: {
    isAnonReservations: boolean;
    isNoSpoil: boolean;
  };
  onCancel: () => void;
  onSaved: () => void;
};

function GiftsModuleConfig({
  eventId,
  eventSlug,
  initialMode,
  initialSettings,
  onCancel,
  onSaved,
}: GiftsModuleConfigProps) {
  const [giftMode, setGiftMode] = useState<EventGiftMode | null>(initialMode);
  const [isAnonReservations, setIsAnonReservations] = useState<boolean>(
    initialSettings.isAnonReservations,
  );
  const [isNoSpoil, setIsNoSpoil] = useState<boolean>(initialSettings.isNoSpoil);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!giftMode) {
      toast.error("Choisissez d'abord le mode des cadeaux.");
      return;
    }

    startTransition(async () => {
      const res = await updateGiftsModuleConfig({
        eventId,
        slug: eventSlug,
        giftMode,
        isAnonReservations,
        isNoSpoil,
      });

      if (!res.ok) {
        toast.error(res.error ?? "Impossible d'enregistrer");
        return;
      }

      toast.success("Paramètres enregistrés");
      onSaved();
    });
  };

  const modeOptions: Array<{
    value: EventGiftMode;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
  }> = [
    {
      value: EventGiftMode.HOST_LIST,
      title: "Une liste d'idées",
      description: "Une seule liste pour tout l'événement. Idéal pour un anniversaire.",
      icon: User,
    },
    {
      value: EventGiftMode.PERSONAL_LISTS,
      title: "Liste par participant",
      description: "Chaque participant crée sa propre liste. Parfait pour Noël.",
      icon: Users,
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <div className="space-y-6 pb-6">
      <div>
        <p className="text-foreground text-sm font-semibold">Paramètres : Liste de cadeaux</p>
        <p className="text-muted-foreground text-sm">
          Configurez la confidentialité et les permissions.
        </p>
      </div>

      <section className="space-y-3">
        <Label className="text-foreground text-sm font-semibold">Mode de fonctionnement</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {modeOptions.map((opt) => {
            const Icon = opt.icon;
            const selected = giftMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGiftMode(opt.value)}
                className={cn(
                  "flex h-full w-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition",
                  selected
                    ? "border-(--primary) bg-(--primary-100) shadow-sm ring-1 ring-(--primary-200)"
                    : "border-border bg-muted/30 hover:bg-white",
                )}
                aria-pressed={selected}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-lg bg-white p-2 text-(--primary-700) shadow-sm")}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span
                    className={cn("font-semibold", selected ? "text-primary" : "text-foreground")}
                  >
                    {opt.title}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-snug">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <Label className="text-foreground text-sm font-semibold">Réservations</Label>
          <p className="text-muted-foreground text-sm">
            Contrôlez l’affichage des réservations (spoilers + identité du réservataire).
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold">Important</p>

            <p className="text-sm leading-snug">
              {isNoSpoil
                ? "Dans ta propre liste, les réservations sont masquées pour éviter les spoilers. Les autres participants voient qu’un cadeau est déjà réservé, pour éviter les doublons."
                : "Le bénéficiaire voit si un cadeau est réservé. Les autres participants voient aussi l’état de réservation, pour éviter les doublons."}
            </p>

            <p className="text-sm leading-snug">
              {isAnonReservations
                ? "L’identité du réservataire est masquée."
                : "L’identité du réservataire est visible."}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 flex items-center justify-between gap-4 rounded-xl border p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Pas de spoil</p>
            <p className="text-muted-foreground text-sm">
              Sur ma propre liste, masquer l’état “réservé” pour éviter de me spoiler.
            </p>
          </div>
          <Switch checked={isNoSpoil} onCheckedChange={setIsNoSpoil} />
        </div>

        <div className="bg-muted/30 flex items-center justify-between gap-4 rounded-xl border p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Afficher qui a réservé</p>
            <p className="text-muted-foreground text-sm">
              Si désactivé, on voit “Réservé” sans voir le nom.
            </p>
          </div>

          {/* ON = afficher l’identité => isAnonReservations = false */}
          <Switch
            checked={!isAnonReservations}
            onCheckedChange={(checked) => setIsAnonReservations(!checked)}
          />
        </div>
      </section>

      </div>

      <div className="bg-background sticky bottom-0 -mx-4 mt-auto flex flex-wrap justify-end gap-3 border-t px-4 py-4 sm:static sm:mx-0 sm:px-0 sm:pb-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
        <Button type="button" onClick={handleSave} disabled={isPending || !giftMode}>
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}

/**
 * MVP: placeholder.
 * Tu remplaceras par un vrai renderer de config par module.
 * Important: pas de modal vide.
 */
function ModuleConfigPlaceholder(props: { moduleKey: EventModuleKey; onOpenModule: () => void }) {
  const { moduleKey, onOpenModule } = props;

  const label =
    moduleKey === EventModuleKey.GIFTS
      ? "Paramètres : Liste de cadeaux"
      : moduleKey === EventModuleKey.TIMELINE
        ? "Paramètres : Programme"
        : moduleKey === EventModuleKey.POTLUCK
          ? "Paramètres : Repas partagé"
          : moduleKey === EventModuleKey.SECRET_SANTA
            ? "Paramètres : Secret Santa"
            : "Paramètres du module";

  return (
    <div className="space-y-4">
      <div className="bg-muted/20 rounded-xl border p-6">
        <p className="text-foreground text-sm font-semibold">{label}</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Configuration en cours de construction. (MVP : écran non vide)
        </p>

        <div className="mt-4">
          <Button type="button" variant="outline" onClick={onOpenModule}>
            Ouvrir le module
          </Button>
        </div>
      </div>

      <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
        Prochaine étape : rendre ce panneau spécifique par module (GIFTS, POTLUCK, SECRET_SANTA…).
      </div>
    </div>
  );
}



