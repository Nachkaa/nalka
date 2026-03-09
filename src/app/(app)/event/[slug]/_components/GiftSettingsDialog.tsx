"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EventGiftMode } from "@prisma/client";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Gift, Users, Eye, EyeOff, Recycle, Hammer, Sparkles, X } from "lucide-react";
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { updateGiftSettings } from "../actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    slug: string;
    giftMode: EventGiftMode;
    isNoSpoil: boolean;
    isAnonReservations: boolean;
    isSecondHandOk: boolean;
    isHandmadeOk: boolean;
    budgetCapCents: number | null;
  };
};

export function GiftSettingsDialog({ open, onOpenChange, event }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [giftMode, setGiftMode] = useState<EventGiftMode>(event.giftMode);
  const [isNoSpoil, setIsNoSpoil] = useState(event.isNoSpoil);
  const [isAnonReservations, setIsAnonReservations] = useState(event.isAnonReservations);
  const [isSecondHandOk, setIsSecondHandOk] = useState(event.isSecondHandOk);
  const [isHandmadeOk, setIsHandmadeOk] = useState(event.isHandmadeOk);
  const [budgetCap, setBudgetCap] = useState(
    event.budgetCapCents ? String(event.budgetCapCents / 100) : "",
  );

  const showVisibility = giftMode === "HOST_LIST" || giftMode === "PERSONAL_LISTS";
  const showGiftTypes = giftMode === "HOST_LIST" || giftMode === "PERSONAL_LISTS";
  const showBudget = giftMode === "PERSONAL_LISTS";

  async function handleSave() {
    startTransition(async () => {
      const result = await updateGiftSettings({
        eventId: event.id,
        slug: event.slug,
        giftMode,
        isNoSpoil,
        isAnonReservations,
        isSecondHandOk,
        isHandmadeOk,
        budgetCapCents: budgetCap ? Math.round(parseFloat(budgetCap) * 100) : null,
      });

      if (result.success) {
        toast.success("Parametres enregistres");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-auto p-0">
        <DialogTitle className="sr-only">Configurer les cadeaux</DialogTitle>
        <DialogDescription className="sr-only">
          Parametres du module cadeaux pour cet evenement.
        </DialogDescription>

        <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Gift className="h-5 w-5 flex-shrink-0" />
              <h2 className="text-lg font-semibold">Configurer les cadeaux</h2>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0 rounded-sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        </div>

        <div className="h-[calc(100dvh-5.5rem)] overflow-auto">
          <div className="mx-auto w-full max-w-2xl px-6 py-6">
            <div className="space-y-6">
              <section className="space-y-3">
                <Label className="text-base font-semibold">Mode</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ModeCard
                    icon={<Gift className="h-5 w-5" />}
                    title="Ma liste uniquement"
                    description="Une seule liste pour l'organisateur"
                    selected={giftMode === "HOST_LIST"}
                    onClick={() => setGiftMode("HOST_LIST")}
                  />
                  <ModeCard
                    icon={<Users className="h-5 w-5" />}
                    title="Liste par personne"
                    description="Chacun peut creer sa liste"
                    selected={giftMode === "PERSONAL_LISTS"}
                    onClick={() => setGiftMode("PERSONAL_LISTS")}
                  />
                </div>
              </section>

              {showVisibility && (
                <section className="space-y-3">
                  <Label className="text-base font-semibold">Visibilite</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CheckboxCard
                      icon={<EyeOff className="h-4 w-4" />}
                      title="Cadeaux caches"
                      description="Je ne vois pas les reservations sur ma liste"
                      checked={isNoSpoil}
                      onCheckedChange={setIsNoSpoil}
                    />
                    <CheckboxCard
                      icon={<Eye className="h-4 w-4" />}
                      title="Reservations anonymes"
                      description="Masquer qui a reserve"
                      checked={isAnonReservations}
                      onCheckedChange={setIsAnonReservations}
                    />
                  </div>
                </section>
              )}

              {showGiftTypes && (
                <section className="space-y-3">
                  <Label className="text-base font-semibold">Types de cadeaux acceptes</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CheckboxCard
                      icon={<Recycle className="h-4 w-4" />}
                      title="Seconde main"
                      description="Objets d'occasion acceptes"
                      checked={isSecondHandOk}
                      onCheckedChange={setIsSecondHandOk}
                    />
                    <CheckboxCard
                      icon={<Hammer className="h-4 w-4" />}
                      title="Fait main"
                      description="Cadeaux DIY acceptes"
                      checked={isHandmadeOk}
                      onCheckedChange={setIsHandmadeOk}
                    />
                  </div>
                </section>
              )}

              {showBudget && (
                <section className="space-y-3">
                  <Label htmlFor="budget" className="text-base font-semibold">
                    Budget maximum (optionnel)
                  </Label>
                  <Input
                    id="budget"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 20"
                    value={budgetCap}
                    onChange={(e) => setBudgetCap(e.target.value)}
                    className="max-w-xs"
                  />
                </section>
              )}

              <div className="border-t pt-6">
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                  >
                    Annuler
                  </Button>

                  <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? (
                      "Enregistrement..."
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/10 ring-primary/20 shadow-sm ring-2"
          : "border-border bg-card hover:bg-muted/60"
      }`}
    >
      <div className="text-primary mb-2">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
      <p className="text-muted-foreground mt-1 text-xs leading-tight">{description}</p>
    </button>
  );
}
