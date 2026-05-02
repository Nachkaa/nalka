"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { normalizeTimeInput, QUARTER_HOUR_TIMES } from "../lib/timeline-utils";

type TimelineTimePickerProps = {
  id: string;
  label: string;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
  isMobile: boolean;
};

export function TimelineTimePicker({
  id,
  label,
  value,
  open,
  onOpenChange,
  onChange,
  isMobile,
}: TimelineTimePickerProps) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedOptionRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const targetValue = value || "12:00";
    const scrollToTarget = () => {
      const list = listRef.current;
      if (!list) return;

      const selected = selectedOptionRef.current;
      if (selected && selected.dataset.time === targetValue) {
        const offset = selected.offsetTop - list.clientHeight / 2 + selected.clientHeight / 2;
        list.scrollTop = Math.max(0, offset);
        return;
      }

      const fallback = list.querySelector<HTMLElement>(`[data-time="${targetValue}"]`);
      if (!fallback) return;

      const offset = fallback.offsetTop - list.clientHeight / 2 + fallback.clientHeight / 2;
      list.scrollTop = Math.max(0, offset);
    };

    const frame = requestAnimationFrame(scrollToTarget);
    return () => cancelAnimationFrame(frame);
  }, [open, value]);

  const normalizedQuery = normalizeTimeInput(query);
  const filteredTimes = useMemo(() => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return QUARTER_HOUR_TIMES;

    return QUARTER_HOUR_TIMES.filter((time) => time.includes(cleanQuery));
  }, [query]);

  const applyValue = (nextValue: string) => {
    onChange(nextValue);
    setQuery(nextValue);
    onOpenChange(false);
  };

  const applyQuery = () => {
    if (!normalizedQuery) return;
    applyValue(normalizedQuery);
  };

  const pickerBody = (
    <div className="flex h-full flex-col gap-3">
      <div className="space-y-2">
        <Label htmlFor={`${id}-input`} className="text-xs">
          Heure
        </Label>
        <Input
          id={`${id}-input`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && normalizedQuery) {
              e.preventDefault();
              applyQuery();
            }
          }}
          placeholder="Ex. 18, 1830, 18:30"
          autoFocus
        />
      </div>

      {query.trim() && !normalizedQuery ? (
        <p className="text-sm text-destructive">Heure invalide.</p>
      ) : null}

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border"
        onWheelCapture={(e) => e.stopPropagation()}
      >
        <div className="p-1">
          {(filteredTimes.length > 0 ? filteredTimes : QUARTER_HOUR_TIMES).map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => applyValue(time)}
              data-time={time}
              ref={value === time ? selectedOptionRef : null}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                value === time ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
              )}
            >
              <span>{time}</span>
              {value === time ? <Check className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => applyValue("")}>
          Effacer
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      {isMobile ? (
        <>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
            onClick={() => onOpenChange(true)}
          >
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {value || "Choisir une heure"}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>

          {open ? (
            <div
              className="fixed inset-0 z-50 flex items-end bg-black/40 sm:hidden"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-background w-full rounded-t-2xl border p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Fermer
                  </Button>
                </div>
                <div className="h-[60vh]">{pickerBody}</div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            >
              <span className={value ? "text-foreground" : "text-muted-foreground"}>
                {value || "Choisir une heure"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-3" align="start">
            <div className="h-[320px]">{pickerBody}</div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
