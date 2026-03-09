// src/lib/dates/format-date.ts
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
  const isoLike = typeof dateLike === "string" ? dateLike : dateLike?.toISOString();
  const dateLabel = isoLike ? formatIsoToFrenchDayMonth(isoLike) : "";
  const t = typeof time === "string" ? time.trim() : "";

  if (dateLabel && t) return `${dateLabel} · ${t}`;
  if (dateLabel) return dateLabel;
  if (t) return t;
  return "";
}
