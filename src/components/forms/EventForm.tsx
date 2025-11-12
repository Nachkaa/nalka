"use client";

import { useFormStatus } from "react-dom";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EyeOff, Eye, Recycle, Hammer } from "lucide-react";

type Initial = {
  title?: string | null;
  description?: string | null;
  dateISO?: string | null;        // e.g. "2025-11-18T00:00:00.000Z"
  location?: string | null;
  rules?: {
    isSecretSanta?: boolean;
    isNoSpoil?: boolean;
    isAnonReservations?: boolean;
    isSecondHandOk?: boolean;
    isHandmadeOk?: boolean;
    budgetCap?: number | null;    // euros (not cents)
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
        {icon && (
          <span className="text-[var(--primary)] flex-shrink-0">
            {icon}
          </span>
        )}
        <div className="flex-1">
          <Label htmlFor={id} className="font-medium">{title}</Label>
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
  const tzOffsetMs = new Date().getTimezoneOffset() * 60_000;
  const todayISO = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 10);

  const rulesRef = useRef<HTMLFieldSetElement>(null);

  const search =
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const mode = search?.get("mode");
  const isSantaFromUrl = mode === "santa";

  const [secretSanta, setSecretSanta] = useState<boolean>(
    initial?.rules?.isSecretSanta ?? isSantaFromUrl ?? false,
  );

  const suggestions = [
    "🎄 Noël en famille",
    "🎂 Anniversaire",
    "🎁 Secret Santa",
    "🏠 Crémaillère",
    "👶 Baby shower",
    "🥂 Réveillon entre amis",
  ];
  const isSecretSantaLabel = (s: string) => /secret\s*santa/i.test(s);

  return (
    <form action={action} className="max-w-2xl space-y-8">
      {/* Informations principales */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Informations principales</h2>

        <div className="space-y-2">
          <Label htmlFor={titleId} className="text-base font-medium">
            Titre de l’événement<span className="text-[var(--destructive)] ml-0.5">*</span>
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
          <div role="list" aria-label="Suggestions de titre" className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((label) => (
              <button
                key={label}
                type="button"
                role="listitem"
                aria-pressed={title === label}
                onClick={() => {
                  setTitle(label);
                  const ss = isSecretSantaLabel(label);
                  setSecretSanta(ss);
                  if (ss) rulesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  document.getElementById(titleId)?.focus();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]/90 hover:text-[var(--foreground)]"
                aria-label={`Utiliser "${label}" comme titre`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={descId} className="text-base font-medium">Description</Label>
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
            Date de l’événement<span className="text-[var(--destructive)] ml-0.5">*</span>
          </Label>
          <Input
            id={dateId}
            name="date"
            type="date"
            required
            min={todayISO}
            defaultValue={
              (initial?.dateISO ? new Date(initial.dateISO) : undefined)?.toISOString().slice(0, 10)
            }
            ref={(el) => {
              if (!el) return;
              el.onclick = () => el.showPicker?.();
            }}
          />
        </div>

        <div className="space-y-2 sm:max-w-sm">
          <Label htmlFor="location" className="text-base font-medium">Lieu de l’événement</Label>
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

      {/* Règles des cadeaux */}
      <fieldset ref={rulesRef} className="space-y-4">
        <legend className="text-lg font-semibold">Règles des cadeaux</legend>
        <p className="text-sm text-muted-foreground">Ces paramètres s’appliquent aux cadeaux de cet événement.</p>

        <div className="space-y-3">
          <Label className="text-base font-medium">Mode</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckboxCard
              name="rules.isSecretSanta"
              title="Secret Santa"
              icon={<span aria-hidden>🎅</span>}
              help="Tirage au sort des duos. Les listes restent privées."
              checked={secretSanta}
              onCheckedChange={setSecretSanta}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">Visibilité</Label>

          {secretSanta ? (
            <>
              <input type="hidden" name="rules.isNoSpoil" value="true" />
              <input type="hidden" name="rules.isAnonReservations" value="true" />
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                Mode Secret Santa activé : les noms sont masqués et votre propre liste ne montre pas les réservations.
              </div>
            </>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckboxCard
                name="rules.isNoSpoil"
                title="Cadeaux cachés dans ma liste"
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

        <div className="space-y-3">
          <Label className="text-base font-medium">Cadeaux acceptés</Label>
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

        <div className="space-y-2">
          <Label htmlFor="budgetCap" className="text-base font-medium">Budget maximum par cadeau (€)</Label>
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
          <p id="budget-hint" className="text-sm text-muted-foreground">
            Laissez vide pour aucun plafond. Affiché comme indication.
          </p>
        </div>
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