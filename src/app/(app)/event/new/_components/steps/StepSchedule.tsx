"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventScheduleMode } from "@prisma/client";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StepHeading } from "./StepHeading";

type Props = {
  mode: EventScheduleMode;
  date: string;
  time: string;
  pollDates: string[];
  onChange: (patch: {
    scheduleMode?: EventScheduleMode;
    scheduleDate?: string;
    scheduleTime?: string;
    pollDates?: string[];
  }) => void;
  onNext?: () => void;
  autoAdvance?: boolean;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtPollDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
}

function buildTimes(stepMinutes = 15) {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

const TIME_OPTIONS = buildTimes(15);
const DEFAULT_TIME_ANCHOR = "19:00";

type InputWithPicker = HTMLInputElement & { showPicker?: () => void };

export function StepSchedule({
  mode,
  date,
  time,
  pollDates,
  onChange,
  onNext,
  autoAdvance = false,
}: Props) {
  const dateRef = useRef<HTMLInputElement | null>(null);

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const timeItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!timePickerOpen) return;

    const anchor = time && time.trim() ? time.trim() : DEFAULT_TIME_ANCHOR;

    // wait for popover content to mount
    requestAnimationFrame(() => {
      const el = timeItemRefs.current[anchor];
      el?.scrollIntoView({ block: "center" });
    });
  }, [timePickerOpen, time]);

  function tryShowPicker() {
    const el = dateRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch {
        // ignore NotAllowedError
      }
    }
  }

  const [pollInput, setPollInput] = useState("");
  const pollRef = useRef<InputWithPicker | null>(null);

  function addPollDate(v: string) {
    if (!v) return;
    const next = Array.from(new Set([...pollDates, v])).sort();
    onChange({ pollDates: next });
    if (autoAdvance && next.length >= 2) onNext?.();
  }

  function removePollDate(v: string) {
    onChange({ pollDates: pollDates.filter((d) => d !== v) });
  }

  const [lastPollDate, setLastPollDate] = useState<string>("");
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const chipsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeDate) return;

    function onPointerDown(e: PointerEvent) {
      const el = chipsRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setActiveDate(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeDate]);

  return (
    <div className="space-y-4">
      <StepHeading title="Quand ?" subtitle="Date, sondage, ou à définir." />

      <Tabs value={mode} onValueChange={(v) => onChange({ scheduleMode: v as EventScheduleMode })}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="EXACT">Date</TabsTrigger>
          <TabsTrigger value="POLL">Sondage</TabsTrigger>
          <TabsTrigger value="TBD">À définir</TabsTrigger>
        </TabsList>

        <TabsContent value="EXACT" className="mt-4 space-y-2">
          <Label htmlFor="date">Choisir une date</Label>
          <Input
            ref={dateRef}
            id="date"
            type="date"
            min={todayISO()}
            value={date}
            onPointerDown={(e) => {
              e.preventDefault();
              tryShowPicker();
              dateRef.current?.focus();
            }}
            onClick={() => {
              tryShowPicker();
            }}
            onChange={(e) => {
              const v = e.target.value;
              onChange({ scheduleDate: v });
              if (autoAdvance && v && v >= todayISO()) onNext?.();
            }}
          />
        </TabsContent>

        <TabsContent value="POLL" className="mt-4 space-y-3">
          <p className="text-muted-foreground text-sm">
            Ajoute quelques dates possibles. Les participants voteront ensuite dans l’événement.
          </p>

          <div ref={chipsRef} className="flex flex-wrap gap-2">
            {pollDates.length === 0 ? (
              <span className="text-muted-foreground text-xs">Aucune date ajoutée.</span>
            ) : (
              pollDates.map((iso) => {
                const active = activeDate === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      if (active) {
                        removePollDate(iso);
                        setActiveDate(null);
                      } else {
                        setActiveDate(iso);
                      }
                    }}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                      active ? "border-red-500 bg-red-50 text-red-700" : "bg-[var(--card)]",
                    ].join(" ")}
                  >
                    <span className="font-medium">{fmtPollDate(iso)}</span>
                    {active && <span className="ml-2 text-xs font-semibold">Supprimer</span>}
                  </button>
                );
              })
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center gap-2 rounded-xl border-2 border-[var(--ring)] bg-[var(--card)] px-4 py-6 text-sm hover:bg-[var(--card)]/80"
                onClick={() => {
                  const el = pollRef.current;
                  if (!el) return;

                  const seed =
                    lastPollDate ||
                    pollDates[pollDates.length - 1] || // latest added (you sort ascending, so this is latest)
                    todayISO();

                  setPollInput(seed);
                  el.value = seed;

                  if (typeof el.showPicker === "function") {
                    try {
                      el.showPicker();
                    } catch {}
                  }
                  el.focus();
                }}
              >
                <span className="bg-[var(--card)]] inline-flex items-center justify-center rounded-full">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-medium">Ajouter une date</span>
              </Button>

              {/* Anchor element for the native picker */}
              <input
                ref={pollRef}
                type="date"
                min={todayISO()}
                value={pollInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setPollInput(v);
                  if (!v) return;

                  addPollDate(v);
                  setLastPollDate(v); // NEW: remember month anchor
                  setPollInput(""); // clear visible state
                  e.currentTarget.value = "";
                }}
                aria-hidden
                tabIndex={-1}
                className="absolute top-1/2 left-3 h-[1px] w-[1px] -translate-y-1/2 opacity-0"
              />
            </div>

            <p className="text-muted-foreground text-xs">Conseil: 2 à 5 dates max.</p>
          </div>
        </TabsContent>

        <TabsContent value="TBD" className="text-muted-foreground mt-4 text-sm">
          L’événement sera créé en mode planification. Tu pourras définir la date plus tard depuis
          la page de l’événement.
        </TabsContent>

        <div className="space-y-2 pt-4">
          <Label htmlFor="scheduleTime">Heure (optionnel)</Label>

          <div className="flex items-center gap-2">
            <Popover open={timePickerOpen} onOpenChange={setTimePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="scheduleTime"
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  aria-label="Sélectionner une heure (optionnel)"
                >
                  <span className={time ? "" : "text-muted-foreground"}>
                    {time ? time : "Ajouter une heure"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher une heure…" />
                  <CommandList>
                    <CommandEmpty>Aucun horaire.</CommandEmpty>
                    <CommandGroup heading="Horaires">
                      <ScrollArea className="h-64">
                        {TIME_OPTIONS.map((t) => {
                          const selected = t === time;
                          return (
                            <CommandItem
                              key={t}
                              value={t}
                              onSelect={() => {
                                onChange({ scheduleTime: t });
                                setTimePickerOpen(false);
                              }}
                              className="flex items-center justify-between"
                              ref={(node) => {
                                timeItemRefs.current[t] = node;
                              }}
                            >
                              <span>{t}</span>
                              {selected ? <Check className="h-4 w-4" aria-hidden /> : null}
                            </CommandItem>
                          );
                        })}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {time ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange({ scheduleTime: "" })}
                aria-label="Effacer l’heure"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>

          <p className="text-muted-foreground text-xs">
            Optionnel. Tu peux le renseigner même si la date est en sondage ou à définir.
          </p>
        </div>
      </Tabs>
    </div>
  );
}
