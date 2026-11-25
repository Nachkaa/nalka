// src/lib/dates/format-date.ts
export function formatIsoToFrenchDate(dateLike?: string | Date | null) {
  if (!dateLike || (dateLike instanceof Date && Number.isNaN(dateLike.getTime()))) return "";
  const iso = typeof dateLike === "string" ? dateLike : dateLike.toISOString();
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.slice(0, 10));
  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : "";
}

export function formatIsoToFrenchDayMonth(isoLike: string) {
  const iso = (isoLike ?? "").slice(0, 10); // accepte "YYYY-MM-DD" ou "YYYY-MM-DDTHH..."
  const [y, m, d] = iso.split("-").map(Number);

  if (!y || !m || !d) return ""; // ou retourne isoLike si tu préfères

  const dt = new Date(Date.UTC(y, m - 1, d));

  const s = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(dt);

  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatEventDateTime(dateLike?: string | Date | null, time?: string | null) {
  const dateLabel = formatIsoToFrenchDate(dateLike);
  const t = typeof time === "string" ? time.trim() : "";

  if (dateLabel && t) return `${dateLabel} · ${t}`;
  if (dateLabel) return dateLabel;
  if (t) return t;
  return "";
}
