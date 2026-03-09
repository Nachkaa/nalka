/**
 * Parses a YYYY-MM-DD string coming from <input type="date"> into a local Date at 00:00.
 * Avoids JS Date timezone quirks with "YYYY-MM-DD" (UTC parsing).
 */
export function parseDateOrThrow(value: string): Date {
  const v = String(value ?? "").trim();
  if (!v) throw new Error("Missing date");

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) throw new Error("Invalid date format");

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  const d = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");

  return d;
}

export function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}
