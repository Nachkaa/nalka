"use client";

import { useFormStatus } from "react-dom";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EyeOff, Eye, Recycle, Hammer, Gift, Shuffle, Users } from "lucide-react";

type GiftMode = "secret-santa" | "personal-lists" | "host-list";

type Initial = {
  title?: string | null;
  description?: string | null;
  dateISO?: string | null; // e.g. "2025-11-18T00:00:00.000Z"
  location?: string | null;
  kind?: string | null; // ex: "christmas", "birthday", ...
  rules?: {
    hasGifts?: boolean;
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
    <div className="relative group cursor-pointer">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 rounded-xl cursor-pointer"
        onClick={() => cbRef.current?.click()}
      />
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
          checked
            ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm"
            : "bg-card border-[var(--border)] hover:bg-muted/60"
        }`}
      >
        {icon && <span className="text-[var(--primary)] flex-shrink-0">{icon}</span>}
        <div className="flex-1">
          <Label htmlFor={id} className="font-medium">
            {title}
          </Label>
          {help && (
            <p id={hintId} className="text-sm text-muted-foreground">
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
          className="pointer-events-none data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
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

  const tzOffsetMs = new Date().getTimezoneOffset() * 60_000;
  const todayISO = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 10);

  const rulesRef = useRef<HTMLFieldSetElement>(null);

  const defaultMode: GiftMode =
    initial?.rules?.mode ??
    (initial?.rules?.isSecretSanta ? "secret-santa" : "personal-lists");

  const [giftMode, setGiftMode] = useState<GiftMode>(defaultMode);
  const [hasGifts, setHasGifts] = useState<boolean>(
    initial?.rules?.hasGifts ?? true
  );

  const suggestions = [
    { label: "🎄 Noël en famille", kind: "christmas", mode: "personal-lists" as GiftMode },
    { label: "🎂 Anniversaire", kind: "birthday", mode: "host-list" as GiftMode },
    { label: "🎁 Secret Santa", kind: "secret-santa", mode: "secret-santa" as GiftMode },
    { label: "🏠 Crémaillère", kind: "housewarming", mode: "host-list" as GiftMode },
    { label: "👶 Baby shower", kind: "baby-shower", mode: "host-list" as GiftMode },
    { label: "🥂 Réveillon entre amis", kind: "party", mode: "personal-lists" as GiftMode },
  ];

  const isSecretSanta = giftMode === "secret-santa";
  const disableGiftSection = !hasGifts;

  const showBudget =
   !disableGiftSection &&
   (giftMode === "secret-santa" || giftMode === "personal-lists");

  return (
    <form action={action} className="max-w-2xl space-y-8">
      {/* 1. Informations principales */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Informations principales</h2>

        <div className="space-y-2">
          <Label htmlFor={titleId} className="text-base font-medium">
            Titre de l’événement
            <span className="text-[var(--destructive)] ml-0.5">*</span>
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
          <div
            role="list"
            aria-label="Suggestions de titre"
            className="mt-3 flex flex-wrap gap-2"
          >
            {suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                role="listitem"
                aria-pressed={title === s.label}
                onClick={() => {
                  setTitle(s.label);
                  setKind(s.kind);
                  setGiftMode(s.mode);
                  if (s.mode === "secret-santa") {
                    setHasGifts(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]/90 hover:text-[var(--foreground)]"
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
            <span className="text-[var(--destructive)] ml-0.5">*</span>
          </Label>
          <Input
            id={dateId}
            name="date"
            type="date"
            required
            min={todayISO}
            defaultValue={
              (initial?.dateISO ? new Date(initial.dateISO) : undefined)
                ?.toISOString()
                .slice(0, 10)
            }
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

      {/* 2. Format de l’événement / cadeaux */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Format de l’événement</legend>

        <div className="space-y-2">
          <Label className="text-base font-medium">
            Voulez-vous gérer des cadeaux avec Nalka ?
          </Label>
          <div className="inline-flex rounded-full border border-[var(--border)] bg-card p-1 text-sm">
            <button
              type="button"
              onClick={() => setHasGifts(true)}
              className={`px-3 py-1.5 rounded-full ${
                hasGifts
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--foreground)]/80"
              }`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => setHasGifts(false)}
              className={`px-3 py-1.5 rounded-full ${
                !hasGifts
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--foreground)]/80"
              }`}
            >
              Non
            </button>
          </div>
          <input
            type="hidden"
            name="rules.hasGifts"
            value={hasGifts ? "true" : "false"}
          />
          {!hasGifts && (
            <p className="text-sm text-muted-foreground">
              Vous pourrez ajouter des listes de cadeaux plus tard si besoin.
            </p>
          )}
        </div>
      </fieldset>

      {/* 3. Cadeaux (affiché seulement si hasGifts) */}
      <fieldset
        ref={rulesRef}
        className={`space-y-4 ${
          disableGiftSection ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <legend className="text-lg font-semibold">Organisation des cadeaux</legend>
        <p className="text-sm text-muted-foreground">
          Choisissez comment vous souhaitez gérer les cadeaux pour cet événement.
        </p>

        {/* Mode */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Mode</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {/* 1. Seulement ma liste */}
            <button
              type="button"
              onClick={() => setGiftMode("host-list")}
              className={`flex flex-col items-start rounded-xl border p-4 text-left text-sm transition-colors ${
                giftMode === "host-list"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm"
                  : "border-[var(--border)] bg-card hover:bg-muted/60"
              }`}
            >
              <div className="mb-2 inline-flex items-center gap-1.5">
                <Gift className="h-4 w-4" />
                <span className="text-base">Seulement ma liste</span>
              </div>
              <p className="text-xs text-muted-foreground">
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
                  : "border-[var(--border)] bg-card hover:bg-muted/60"
              }`}
            >
              <div className="mb-2 inline-flex items-center gap-1.5">
                <Shuffle className="h-4 w-4" />
                <span className="text-base">Secret Santa</span>
              </div>
              <p className="text-xs text-muted-foreground">
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
                  : "border-[var(--border)] bg-card hover:bg-muted/60"
              }`}
            >
              <div className="mb-2 inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="text-base">Une liste par personne</span>
              </div>
              <p className="text-xs text-muted-foreground">
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
        <div className="space-y-3">
          <Label className="text-base font-medium">Visibilité</Label>

          {isSecretSanta ? (
            <>
              <input type="hidden" name="rules.isNoSpoil" value="true" />
              <input type="hidden" name="rules.isAnonReservations" value="true" />
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                En Secret Santa, les noms restent cachés et vous ne voyez pas les
                réservations sur votre propre liste.
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

        {/* Préférences globales pour les cadeaux */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Types de cadeaux acceptés</Label>
          <p className="text-sm text-muted-foreground">
            Ces préférences s’appliquent par défaut. Vous pourrez les ajuster cadeau
            par cadeau plus tard.
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
                typeof initial?.rules?.budgetCap === "number"
                  ? String(initial.rules.budgetCap)
                  : ""
              }
            />
            <p id="budget-hint" className="text-sm text-muted-foreground">
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
        className="h-14 w-full text-lg font-medium rounded-xl shadow-sm sm:h-16 sm:text-xl transition-all duration-150 hover:shadow-md"
      >
        {pending ? "Enregistrement…" : label}
      </Button>
    </div>
  );
}
