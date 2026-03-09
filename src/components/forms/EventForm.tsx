"use client";

import { useFormStatus } from "react-dom";
import { useId, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EyeOff, Eye, Recycle, Hammer, Gift, Shuffle, Users, Ban } from "lucide-react";

export type GiftMode = "none" | "host-list" | "secret-santa" | "personal-lists";

type Initial = {
  title?: string | null;
  description?: string | null;
  dateISO?: string | null; // e.g. "2025-11-18T00:00:00.000Z"
  location?: string | null;
  kind?: string | null; // ex: "christmas", "birthday", ...
  rules?: {
    mode?: GiftMode;
    isSecretSanta?: boolean;
    isNoSpoil?: boolean;
    isAnonReservations?: boolean;
    isSecondHandOk?: boolean;
    isHandmadeOk?: boolean;
    budgetCap?: number | null; // euros (not cents)
  };
};

function CheckboxCard({
  name,
  title,
  help,
  icon,
  defaultChecked = false,
  checked: controlled,
  onCheckedChange,
}: {
  name: string;
  title: React.ReactNode;
  help?: string;
  icon?: React.ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [internal, setInternal] = useState<boolean>(defaultChecked);
  const checked = controlled ?? internal;
  const setChecked = (v: boolean) => {
    if (onCheckedChange) onCheckedChange(v);
    else setInternal(v);
  };
  const cbRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="group relative cursor-pointer">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 cursor-pointer rounded-xl"
        onClick={() => cbRef.current?.click()}
      />
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
          checked
            ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm"
            : "bg-card hover:bg-muted/60 border-[var(--border)]"
        }`}
      >
        {icon && <span className="flex-shrink-0 text-[var(--primary)]">{icon}</span>}
        <div className="flex-1">
          <Label htmlFor={id} className="font-medium">
            {title}
          </Label>
          {help && (
            <p id={hintId} className="text-muted-foreground text-sm">
              {help}
            </p>
          )}
        </div>
        <Checkbox
          id={id}
          ref={cbRef}
          checked={checked}
          onCheckedChange={(v) => setChecked(Boolean(v))}
          aria-describedby={help ? hintId : undefined}
          className="pointer-events-none data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
        />
        <input type="hidden" name={name} value={checked ? "true" : "false"} />
      </div>
    </div>
  );
}

export default function EventForm({
  action,
  initial,
  submitLabel = "✨ Créer mon événement",
  hideSuggestions = false,
}: {
  action: (data: FormData) => Promise<void>;
  initial?: Initial;
  submitLabel?: string;
  hideSuggestions?: boolean; // true on edit
}) {
  const titleId = useId();
  const descId = useId();
  const dateId = useId();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [kind, setKind] = useState<string | null>(initial?.kind ?? null);

  const todayISO = useMemo(() => {
    const d = new Date();
    // On veut "YYYY-MM-DD" en local, sans Date.now()
    const tzOffsetMs = d.getTimezoneOffset() * 60_000;
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
  }, []);

  const rulesRef = useRef<HTMLFieldSetElement>(null);

  const defaultMode: GiftMode =
    initial?.rules?.mode ?? (initial?.rules?.isSecretSanta ? "secret-santa" : "personal-lists");

  const [giftMode, setGiftMode] = useState<GiftMode>(defaultMode);

  const suggestions = [
    { label: "🎄 Noël en famille", kind: "christmas", mode: "personal-lists" as GiftMode },
    { label: "🎂 Anniversaire", kind: "birthday", mode: "host-list" as GiftMode },
    { label: "🎁 Secret Santa", kind: "secret-santa", mode: "secret-santa" as GiftMode },
    { label: "🏠 Crémaillère", kind: "housewarming", mode: "host-list" as GiftMode },
    { label: "👶 Baby shower", kind: "baby-shower", mode: "host-list" as GiftMode },
    { label: "🥂 Réveillon entre amis", kind: "party", mode: "personal-lists" as GiftMode },
  ];

  const isSecretSanta = giftMode === "secret-santa";
  const disableGiftSection = giftMode === "none";

  const showBudget =
    !disableGiftSection && (giftMode === "secret-santa" || giftMode === "personal-lists");

  return (
    <form action={action} className="max-w-2xl space-y-8">
      {/* 1. Informations principales */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Informations principales</h2>

        <div className="space-y-2">
          <Label htmlFor={titleId} className="text-base font-medium">
            Titre de l’événement
            <span className="ml-0.5 text-[var(--destructive)]">*</span>
          </Label>
          <Input
            id={titleId}
            name="title"
            placeholder="Ex. Noël ensemble"
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {!hideSuggestions && (
          <div aria-label="Suggestions de titre" className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                aria-pressed={title === s.label}
                onClick={() => {
                  setTitle(s.label);
                  setKind(s.kind);
                  setGiftMode(s.mode);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--foreground)]/90 transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label={`Utiliser "${s.label}" comme titre`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <input type="hidden" name="kind" value={kind ?? ""} />

        <div className="space-y-2">
          <Label htmlFor={descId} className="text-base font-medium">
            Description
          </Label>
          <Textarea
            id={descId}
            name="description"
            rows={4}
            placeholder="Ajoutez un petit mot, un thème..."
            defaultValue={initial?.description ?? ""}
          />
        </div>

        <div className="space-y-2 sm:max-w-sm">
          <Label htmlFor={dateId} className="text-base font-medium">
            Date de l’événement
            <span className="ml-0.5 text-[var(--destructive)]">*</span>
          </Label>
          <Input
            id={dateId}
            name="date"
            type="date"
            required
            min={todayISO}
            defaultValue={(initial?.dateISO ? new Date(initial.dateISO) : undefined)
              ?.toISOString()
              .slice(0, 10)}
            ref={(el) => {
              if (!el) return;
              el.onclick = () => el.showPicker?.();
            }}
          />
        </div>

        <div className="space-y-2 sm:max-w-sm">
          <Label htmlFor="location" className="text-base font-medium">
            Lieu de l’événement
          </Label>
          <Input
            id="location"
            name="location"
            placeholder="Ex. Chez Marie"
            type="text"
            maxLength={100}
            defaultValue={initial?.location ?? ""}
          />
        </div>
      </section>

      {/* 3. Cadeaux */}
      <fieldset ref={rulesRef} className={`space-y-4`}>
        <legend className="text-lg font-semibold">Organisation des cadeaux</legend>
        <p className="text-muted-foreground text-sm">
          Choisissez comment vous souhaitez gérer les cadeaux pour cet événement.
        </p>

        {/* Mode */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Mode</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {/* 0. Pas de cadeaux */}
            <button
              type="button"
              onClick={() => setGiftMode("none")}
              className={`flex flex-col items-start rounded-xl border p-4 text-left text-sm transition-colors ${
                giftMode === "none"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm"
                  : "bg-card hover:bg-muted/60 border-[var(--border)]"
              }`}
            >
              <div className="mb-2 inline-flex items-center gap-1.5">
                <Ban className="h-4 w-4" />
                <span className="text-base">Pas de cadeaux</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Aucun cadeau prévu pour cet événement.
              </p>
            </button>
            {/* 1. Seulement ma liste */}
            <button
              type="button"
              onClick={() => setGiftMode("host-list")}
              className={`flex flex-col items-start rounded-xl border p-4 text-left text-sm transition-colors ${
                giftMode === "host-list"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm"
                  : "bg-card hover:bg-muted/60 border-[var(--border)]"
              }`}
            >
              <div className="mb-2 inline-flex items-center gap-1.5">
                <Gift className="h-4 w-4" />
                <span className="text-base">Seulement ma liste</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Une seule liste pour l’organisateur (anniversaire, crémaillère…).
              </p>
            </button>

            {/* 2. Secret Santa */}
            <button
              type="button"
              onClick={() => setGiftMode("secret-santa")}
              className={`flex flex-col items-start rounded-xl border p-4 text-left text-sm transition-colors ${
                giftMode === "secret-santa"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm"
                  : "bg-card hover:bg-muted/60 border-[var(--border)]"
              }`}
            >
              <div className="mb-2 inline-flex items-center gap-1.5">
                <Shuffle className="h-4 w-4" />
                <span className="text-base">Secret Santa</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Tirage au sort des duos, listes privées.
              </p>
            </button>

            {/* 3. Une liste par personne */}
            <button
              type="button"
              onClick={() => setGiftMode("personal-lists")}
              className={`flex flex-col items-start rounded-xl border p-4 text-left text-sm transition-colors ${
                giftMode === "personal-lists"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm"
                  : "bg-card hover:bg-muted/60 border-[var(--border)]"
              }`}
            >
              <div className="mb-2 inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="text-base">Une liste par personne</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Chaque invité a sa propre liste (Noël en famille, couple…).
              </p>
            </button>
          </div>

          {/* Valeurs envoyées côté serveur */}
          <input type="hidden" name="rules.mode" value={giftMode} />
          <input
            type="hidden"
            name="rules.isSecretSanta"
            value={isSecretSanta ? "true" : "false"}
          />
        </div>

        {/* Visibilité */}
        {giftMode !== "none" && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Visibilité</Label>

            {isSecretSanta ? (
              <>
                <input type="hidden" name="rules.isNoSpoil" value="true" />
                <input type="hidden" name="rules.isAnonReservations" value="true" />
                <div className="bg-muted/40 text-muted-foreground rounded-lg border p-4 text-sm">
                  En Secret Santa, les noms restent cachés et vous ne voyez pas les réservations sur
                  votre propre liste.
                </div>
              </>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <CheckboxCard
                  name="rules.isNoSpoil"
                  title={
                    <>
                      Cadeaux cachés <span className="whitespace-nowrap">dans ma liste</span>
                    </>
                  }
                  help="Je ne vois pas quels cadeaux de ma propre liste ont été réservés."
                  icon={<EyeOff className="h-5 w-5" />}
                  defaultChecked={Boolean(initial?.rules?.isNoSpoil)}
                />
                <CheckboxCard
                  name="rules.isAnonReservations"
                  title="Réservations anonymes"
                  help="Les invités voient qu’un cadeau est réservé sans savoir par qui."
                  icon={<Eye className="h-5 w-5" />}
                  defaultChecked={Boolean(initial?.rules?.isAnonReservations)}
                />
              </div>
            )}
          </div>
        )}
        {/* Préférences globales pour les cadeaux */}
        {giftMode !== "none" && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Types de cadeaux acceptés</Label>
            <p className="text-muted-foreground text-sm">
              Ces préférences s’appliquent par défaut. Vous pourrez les ajuster cadeau par cadeau
              plus tard.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckboxCard
                name="rules.isSecondHandOk"
                title="Seconde main acceptée"
                help="Autoriser les objets d’occasion."
                icon={<Recycle className="h-5 w-5" />}
                defaultChecked={Boolean(initial?.rules?.isSecondHandOk)}
              />
              <CheckboxCard
                name="rules.isHandmadeOk"
                title="Fait main accepté"
                help="Autoriser les cadeaux faits main."
                icon={<Hammer className="h-5 w-5" />}
                defaultChecked={Boolean(initial?.rules?.isHandmadeOk)}
              />
            </div>
          </div>
        )}
        {/* Budget */}
        {showBudget && (
          <div className="space-y-2">
            <Label htmlFor="budgetCap" className="text-base font-medium">
              Budget maximum par cadeau (€)
            </Label>
            <Input
              id="budgetCap"
              name="rules.budgetCap"
              type="text"
              inputMode="decimal"
              placeholder="Ex. 20"
              aria-describedby="budget-hint"
              autoComplete="off"
              className="w-40"
              defaultValue={
                typeof initial?.rules?.budgetCap === "number" ? String(initial.rules.budgetCap) : ""
              }
            />
            <p id="budget-hint" className="text-muted-foreground text-sm">
              Laissez vide pour aucun plafond. Affiché comme indication.
            </p>
          </div>
        )}
      </fieldset>

      <Submit label={submitLabel} />
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="pt-8">
      <Button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="h-14 w-full rounded-xl text-lg font-medium shadow-sm transition-all duration-150 hover:shadow-md sm:h-16 sm:text-xl"
      >
        {pending ? "Enregistrement…" : label}
      </Button>
    </div>
  );
}
