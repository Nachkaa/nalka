"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventLocationMode } from "@prisma/client";
import {
  Beer,
  Building2,
  Dumbbell,
  Globe,
  Home,
  Hotel,
  Landmark,
  MapPin,
  Navigation,
  Plus,
  Sparkles,
  Trees,
  Users,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StepHeading } from "./StepHeading";
import type { ThemeValue } from "./StepType";

type Props = {
  mode: EventLocationMode;
  location: string;
  pollLocations: string[];
  theme?: ThemeValue;
  displayName?: string;
  onChange: (patch: {
    locationMode?: EventLocationMode;
    location?: string;
    pollLocations?: string[];
  }) => void;
  onNext?: () => void;
  autoAdvance?: boolean;
};

type Suggestion = {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const BY_THEME: Record<ThemeValue, Suggestion[]> = {
  social: [
    { value: "Bar / apéro", label: "Bar / apéro", icon: Beer },
    { value: "Restaurant", label: "Restaurant", icon: Utensils },
    { value: "Activité", label: "Activité", icon: Sparkles },
    { value: "En extérieur", label: "En extérieur", icon: Trees },
    { value: "Chez quelqu’un", label: "Chez quelqu’un", icon: Home },
  ],
  family: [
    { value: "Restaurant", label: "Restaurant", icon: Utensils },
    { value: "Chez quelqu’un", label: "Chez quelqu’un", icon: Home },
    { value: "Salle privée", label: "Salle privée", icon: Building2 },
    { value: "En extérieur", label: "En extérieur", icon: Trees },
  ],
  sport: [
    { value: "Parc / extérieur", label: "Parc / extérieur", icon: Trees },
    { value: "Salle", label: "Salle", icon: Dumbbell },
    { value: "Terrain / stade", label: "Terrain / stade", icon: Landmark },
    { value: "Sortie nature", label: "Sortie nature", icon: Navigation },
  ],
  trip: [
    { value: "Hébergement", label: "Hébergement", icon: Hotel },
    { value: "Centre-ville", label: "Centre-ville", icon: MapPin },
    { value: "Point de départ", label: "Point de départ", icon: Navigation },
    { value: "Sur place", label: "Sur place", icon: Landmark },
  ],
  group: [
    { value: "Afterwork", label: "Afterwork", icon: Users },
    { value: "Salle / local", label: "Salle / local", icon: Building2 },
    { value: "Lieu public", label: "Lieu public", icon: MapPin },
    { value: "En ligne", label: "En ligne", icon: Globe },
  ],
  custom: [
    { value: "Restaurant", label: "Restaurant", icon: Utensils },
    { value: "Activité", label: "Activité", icon: Sparkles },
    { value: "En extérieur", label: "En extérieur", icon: Trees },
    { value: "En ligne", label: "En ligne", icon: Globe },
  ],
};

function firstName(displayName?: string) {
  const n = (displayName ?? "").trim();
  return n ? n.split(/\s+/)[0] : null;
}

function normalize(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

export function StepLocation({
  mode,
  location,
  pollLocations,
  theme = "custom",
  displayName,
  onChange,
  onNext,
  autoAdvance = false,
}: Props) {
  const [adding, setAdding] = useState(false);

  const host = firstName(displayName);

  const suggestions = useMemo(() => {
    const themed = BY_THEME[theme] ?? [];
    const base: Suggestion[] = [
      ...(host ? [{ value: `Chez ${host}`, label: `Chez ${host}`, icon: Home } as Suggestion] : []),
    ];

    const uniq = new Map<string, Suggestion>();
    for (const s of [...base, ...themed]) uniq.set(s.value, s);
    return Array.from(uniq.values()).slice(0, 10);
  }, [theme, host]);

  // Poll UX (same as dates)
  const [pollInput, setPollInput] = useState("");
  const pollRef = useRef<HTMLInputElement | null>(null);
  const chipsRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    function onPointerDown(e: PointerEvent) {
      const el = chipsRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setActive(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [active]);

  function addPollLocation(v: string) {
    const clean = normalize(v);
    if (!clean) return;

    const next = Array.from(new Set([...pollLocations, clean])).slice(0, 5);
    onChange({ pollLocations: next });

    if (autoAdvance && next.length >= 2) onNext?.();
  }

  function removePollLocation(v: string) {
    onChange({ pollLocations: pollLocations.filter((x) => x !== v) });
  }

  function pickSuggestion(v: string) {
    if (mode === "POLL") {
      addPollLocation(v);
      return;
    }

    onChange({ location: v });
    if (autoAdvance) onNext?.();
  }

  return (
    <div className="space-y-4">
      <StepHeading
        title="Où ?"
        subtitle="Choisis un lieu, propose un sondage, ou laisse à définir."
      />

      <Tabs
        value={mode}
        onValueChange={(v) => {
          const next = v as EventLocationMode;
          if (next === "EXACT") {
            onChange({ locationMode: next, pollLocations: [] });
            return;
          }
          if (next === "POLL") {
            onChange({ locationMode: next, location: "" });
            return;
          }
          onChange({ locationMode: next, location: "", pollLocations: [] });
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="EXACT">Lieu</TabsTrigger>
          <TabsTrigger value="POLL">Sondage</TabsTrigger>
          <TabsTrigger value="TBD">À définir</TabsTrigger>
        </TabsList>

        {/* EXACT */}
        <TabsContent value="EXACT" className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="location">Lieu (optionnel)</Label>
            <p className="text-muted-foreground text-xs">
              Choisis un cadre. Tu pourras préciser plus tard.
            </p>
          </div>

          <Input
            id="location"
            value={location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Ex : Bar · Restaurant · Activité · À définir…"
          />

          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">Suggestions</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const Icon = s.icon;
                return (
                  <Button
                    key={s.value}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => pickSuggestion(s.value)}
                  >
                    <Icon className="mr-2 h-4 w-4" aria-hidden />
                    {s.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* POLL */}
        <TabsContent value="POLL" className="mt-4 space-y-3">
          <p className="text-muted-foreground text-sm">
            Ajoute quelques options. Les participants voteront ensuite dans l’événement.
          </p>

          <div ref={chipsRef} className="flex flex-wrap gap-2">
            {pollLocations.length === 0 ? (
              <span className="text-muted-foreground text-xs">Aucune option ajoutée.</span>
            ) : (
              pollLocations.map((v) => {
                const isActive = active === v;

                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        removePollLocation(v);
                        setActive(null);
                      } else {
                        setActive(v);
                      }
                    }}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                      isActive ? "border-red-500 bg-red-50 text-red-700" : "bg-[var(--card)]",
                    ].join(" ")}
                  >
                    <span className="font-medium">{v}</span>
                    {isActive && <span className="ml-2 text-xs font-semibold">Supprimer</span>}
                  </button>
                );
              })
            )}
          </div>

          <div className="space-y-2">
            {!adding ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center gap-2 rounded-xl border-2 border-[var(--ring)] bg-[var(--card)] px-4 py-6 text-sm hover:bg-[var(--card)]/80"
                onClick={() => {
                  setAdding(true);
                  requestAnimationFrame(() => pollRef.current?.focus());
                }}
              >
                <Plus className="h-4 w-4" aria-hidden />
                <span className="font-medium">Ajouter une option</span>
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  ref={pollRef}
                  value={pollInput}
                  onChange={(e) => setPollInput(e.target.value)}
                  onBlur={() => {
                    // optional: auto-add on blur if valid
                    const v = pollInput.trim();
                    if (v) addPollLocation(v);
                    setPollInput("");
                    setAdding(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPollLocation(pollInput);
                      setPollInput("");
                      setAdding(false);
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setPollInput("");
                      setAdding(false);
                    }
                  }}
                  placeholder="Ex : Restaurant, Bar, Chez quelqu’un…"
                />

                <p className="text-muted-foreground text-xs">Conseil : 2 à 5 options max.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">Suggestions</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const Icon = s.icon;
                return (
                  <Button
                    key={s.value}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => addPollLocation(s.value)}
                  >
                    <Icon className="mr-2 h-4 w-4" aria-hidden />
                    {s.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* TBD */}
        <TabsContent value="TBD" className="text-muted-foreground mt-4 text-sm">
          L’événement sera créé en mode planification. Tu pourras définir le lieu plus tard depuis
          la page de l’événement (et lancer un sondage si besoin).
        </TabsContent>
      </Tabs>
    </div>
  );
}
