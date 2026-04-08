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
import { DatePickerISO } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventScheduleMode } from "@prisma/client";
import { Check, ChevronDown, X } from "lucide-react";
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

export function StepSchedule({
  mode,
  date,
  time,
  pollDates,
  onChange,
  onNext,
  autoAdvance = false,
}: Props) {
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

  const [pollPickerValue, setPollPickerValue] = useState("");

  function addPollDate(v: string) {
    if (!v) return;
    const next = Array.from(new Set([...pollDates, v])).sort();
    onChange({ pollDates: next });
    if (autoAdvance && next.length >= 2) onNext?.();
  }

  function removePollDate(v: string) {
    onChange({ pollDates: pollDates.filter((d) => d !== v) });
  }

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
          <DatePickerISO
            value={date}
            onChange={(iso) => {
              const v = iso ?? "";
              onChange({ scheduleDate: v });
              if (autoAdvance && v) onNext?.();
            }}
            placeholder="Sélectionner une date"
            disablePast
            autoOpen={false}
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
            <DatePickerISO
              value={pollPickerValue}
              onChange={(iso) => {
                const v = iso ?? "";
                setPollPickerValue(v);
                if (!v) return;

                addPollDate(v);
                setPollPickerValue("");
              }}
              placeholder="Ajouter une date"
              disablePast
              autoOpen={false}
            />

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
