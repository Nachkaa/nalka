// components/ui/date-picker.tsx
"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date | null;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disablePast?: boolean;
  autoOpen?: boolean;
  displayFormat?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Choisir une date",
  disabled,
  disablePast = false,
  autoOpen = false,
  displayFormat = "PPP",
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date ?? undefined);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedDate(date ?? undefined);
  }, [date]);

  const prevAutoOpen = React.useRef(false);
  React.useEffect(() => {
    // déclenche seulement sur false -> true
    if (!disabled && autoOpen && !prevAutoOpen.current) setOpen(true);
    prevAutoOpen.current = autoOpen;
  }, [autoOpen, disabled]);

  const handleSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
    if (newDate) setOpen(false); // ferme après sélection
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const label = selectedDate ? format(selectedDate, displayFormat, { locale: fr }) : null;

  const prettyLabel = label ? label.charAt(0).toUpperCase() + label.slice(1) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? prettyLabel : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={
            disablePast
              ? (d) => {
                  const x = new Date(d);
                  x.setHours(0, 0, 0, 0);
                  return x < today;
                }
              : undefined
          }
          initialFocus
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}

/** YYYY-MM-DD (local) */
export function dateToISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function isoToDate(iso: string) {
  // iso expected: YYYY-MM-DD
  const [y, m, d] = iso.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

type DatePickerISOProps = {
  value?: string | null; // YYYY-MM-DD
  onChange?: (iso: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disablePast?: boolean;
  autoOpen?: boolean;
  displayFormat?: string;
};

export function DatePickerISO({
  value,
  onChange,
  placeholder = "Choisir une date",
  disabled,
  disablePast = false,
  autoOpen = false,
  displayFormat = "PPP",
}: DatePickerISOProps) {
  const date = value ? isoToDate(value) : undefined;

  return (
    <DatePicker
      date={date ?? null}
      disabled={disabled}
      disablePast={disablePast}
      placeholder={placeholder}
      autoOpen={autoOpen}
      displayFormat={displayFormat}
      onDateChange={(d) => onChange?.(d ? dateToISO(d) : undefined)}
    />
  );
}
