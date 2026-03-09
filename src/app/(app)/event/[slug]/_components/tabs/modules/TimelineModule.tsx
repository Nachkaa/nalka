export type TimelineModuleProps = {
  eventOn: string | null;
  eventTime?: string | null;
  location?: string | null;
  scheduleMode?: string | null;
  locationMode?: string | null;
};

export function TimelineModule({
  eventOn,
  eventTime,
  location,
  scheduleMode,
  locationMode,
}: TimelineModuleProps) {
  const formatDateLabel = () => {
    const t = eventTime?.trim();
    const base = eventOn
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(new Date(eventOn))
      : null;

    if (base && t) return `${base} · ${t}`;
    if (base) return base;
    if (t) return t;
    return "À planifier";
  };

  const dateLabel = formatDateLabel();
  const locationLabel = location?.trim() || "Lieu à confirmer";

  return (
    <div className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">Résumé</p>
        <h2 className="text-foreground text-xl font-semibold">Programme</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-border bg-muted/40 rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-xs font-semibold">Date & horaire</p>
          <p className="text-foreground text-sm font-medium">{dateLabel}</p>
          <p className="text-muted-foreground mt-1 text-xs">Mode : {scheduleMode ?? "—"}</p>
        </div>

        <div className="border-border bg-muted/40 rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-xs font-semibold">Lieu</p>
          <p className="text-foreground text-sm font-medium">{locationLabel}</p>
          <p className="text-muted-foreground mt-1 text-xs">Mode : {locationMode ?? "—"}</p>
        </div>
      </div>

      <div className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-5 text-sm">
        La timeline détaillée (ordre du jour, tâches, checkpoints) arrivera bientôt ici.
      </div>
    </div>
  );
}
