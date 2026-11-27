"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventLocationMode } from "@prisma/client";
import {
  Building2,
  Globe,
  Home,
  Hotel,
  Landmark,
  MapPin,
  Plus,
  Trees,
  Utensils,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

const SHARED_SUGGESTIONS: Suggestion[] = [
  { value: "À la maison", label: "À la maison", icon: Home },
  { value: "Chez des proches", label: "Chez des proches", icon: Home },
  { value: "Au restaurant", label: "Au restaurant", icon: Utensils },
  { value: "Salle des fêtes", label: "Salle des fêtes", icon: Landmark },
  { value: "En plein air", label: "En plein air", icon: Trees },
  { value: "En ligne", label: "En ligne", icon: Globe },
];

const BY_THEME: Record<ThemeValue, Suggestion[]> = {
  christmas: [
    { value: "Au bureau", label: "Au bureau", icon: Building2 },
    { value: "À la maison", label: "À la maison", icon: Home },
    { value: "Chez des proches", label: "Chez des proches", icon: Home },
    { value: "Au restaurant", label: "Au restaurant", icon: Utensils },
    { value: "En ligne", label: "En ligne", icon: Globe },
  ],
  social: SHARED_SUGGESTIONS,
  family: SHARED_SUGGESTIONS,
  sport: [
    { value: "Au parc", label: "Au parc", icon: Trees },
    { value: "Au club", label: "Au club", icon: Landmark },
    { value: "Point de rendez-vous", label: "Point de rendez-vous", icon: MapPin },
  ],
  trip: [
    { value: "Au chalet", label: "Au chalet", icon: Home },
    { value: "À l'hôtel", label: "À l'hôtel", icon: Hotel },
    { value: "En location", label: "En location", icon: Home },
  ],
  group: SHARED_SUGGESTIONS,
  custom: SHARED_SUGGESTIONS,
};

function normalize(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

export function StepLocation({
  mode,
  location,
  pollLocations,
  theme = "custom",
  onChange,
  onNext,
  autoAdvance = false,
}: Props) {
  const [adding, setAdding] = useState(false);
  const suggestions = BY_THEME[theme];

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
        title="Lieu"
        subtitle="Indiquez un lieu connu, proposez un sondage ou laissez ce point à définir."
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

        <TabsContent value="EXACT" className="mt-4 space-y-3">
          <Label htmlFor="location">Lieu</Label>

          <Input
            id="location"
            value={location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Ex. À la maison, au restaurant, au chalet…"
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

        <TabsContent value="POLL" className="mt-4 space-y-3">
          <p className="text-muted-foreground text-sm">
            Ajoutez quelques options. Les participants voteront ensuite dans l&apos;événement.
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
                  placeholder="Ex. À la maison, au restaurant, au chalet…"
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

        <TabsContent value="TBD" className="text-muted-foreground mt-4 text-sm">
          L&apos;événement sera créé en mode planification. Vous pourrez définir le lieu plus tard
          depuis la page de l&apos;événement et lancer un sondage si besoin.
        </TabsContent>
      </Tabs>
    </div>
  );
}
