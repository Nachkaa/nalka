export function normalizeTimeHHmm(input: string | null | undefined) {
  const v = (input ?? "").trim();
  if (!v) return null;
  // HTML time input gives "HH:mm"
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(v)) return null;
  return v;
}

export function formatEventDateTime(params: {
  eventDate: Date | null;
  eventTime: string | null;
  locale?: string;
}) {
  const { eventDate, eventTime, locale = "fr-FR" } = params;
  if (!eventDate && !eventTime) return null;

  const datePart = eventDate
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(eventDate)
    : null;

  // If time exists but no date, show time alone (rare but possible during setup)
  if (!datePart) return eventTime ?? null;

  return eventTime ? `${datePart} · ${eventTime}` : datePart;
}
