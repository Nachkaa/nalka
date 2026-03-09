// app/(app)/event/[slug]/edit/_components/BasicEventForm.tsx

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { updateBasicInfo } from "../actions";

type Props = {
  eventId: string;
  slug: string;
  defaultValues: {
    title: string;
    description: string;
    eventOn: Date | null;
    eventTime: string | null;
    location: string;
  };
};

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

export function BasicEventForm({ eventId, slug, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State local pour la date
  const [eventDate, setEventDate] = useState<Date | undefined>(defaultValues.eventOn ?? undefined);

  const [eventTime, setEventTime] = useState<string>(defaultValues.eventTime ?? "");
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const timeItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Ajouter la date au FormData si elle existe
    if (eventDate) {
      formData.set("eventOn", eventDate.toISOString().split("T")[0]);
    } else {
      formData.delete("eventOn");
    }

    formData.set("eventTime", eventTime);

    startTransition(async () => {
      try {
        await updateBasicInfo(eventId, slug, formData);
        toast.success("Événement mis à jour");
        router.push(`/event/${slug}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Titre de l&apos;événement <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Ex. Noël en famille"
          defaultValue={defaultValues.title}
          maxLength={100}
          autoComplete="off"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Quelques mots sur l'événement (optionnel)"
          defaultValue={defaultValues.description}
          maxLength={500}
          className="resize-none"
        />
        <p className="text-muted-foreground text-xs">Décrivez brièvement votre événement</p>
      </div>

      {/* Date avec le nouveau DatePicker */}
      <div className="space-y-2">
        <Label htmlFor="eventOn">Date de l&apos;événement</Label>
        <DatePicker
          date={eventDate}
          onDateChange={setEventDate}
          placeholder="Sélectionner une date"
          disabled={isPending}
          disablePast
        />
        <p className="text-muted-foreground text-xs">
          {eventDate && eventDate < new Date()
            ? "⚠️ Cette date est passée, pensez à la mettre à jour"
            : "Sélectionnez la date de votre événement"}
        </p>
      </div>

      {/* Horaire */}
      <div className="space-y-2">
        <Label htmlFor="eventTime">Heure</Label>

        <div className="flex items-center gap-2">
          <Popover open={timePickerOpen} onOpenChange={setTimePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                id="eventTime"
                type="button"
                variant="outline"
                className="w-full justify-between"
                aria-label="Sélectionner une heure"
                disabled={isPending}
              >
                <span className={eventTime ? "" : "text-muted-foreground"}>
                  {eventTime ? eventTime : "Ajouter une heure"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-[320px] p-0"
              align="start"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                const anchor = eventTime.trim() ? eventTime.trim() : DEFAULT_TIME_ANCHOR;
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    timeItemRefs.current[anchor]?.scrollIntoView({ block: "center" });
                  });
                });
              }}
            >
              <Command>
                <CommandInput placeholder="Rechercher une heure…" />
                <CommandList>
                  <CommandEmpty>Aucun horaire.</CommandEmpty>
                  <CommandGroup heading="Horaires">
                    <ScrollArea className="h-64">
                      {TIME_OPTIONS.map((t) => {
                        const selected = t === eventTime;
                        return (
                          <CommandItem
                            key={t}
                            value={t}
                            onSelect={() => {
                              setEventTime(t);
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

          {eventTime ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setEventTime("")}
              aria-label="Effacer l’heure"
              disabled={isPending}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>

        {/* Hidden input so FormData still contains eventTime even without manual set() */}
        <input type="hidden" name="eventTime" value={eventTime} />
      </div>

      {/* Lieu */}
      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input
          id="location"
          name="location"
          type="text"
          placeholder="Ex. Chez Mamie"
          defaultValue={defaultValues.location}
          maxLength={200}
          autoComplete="off"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/event/${slug}`)}
          disabled={isPending}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
