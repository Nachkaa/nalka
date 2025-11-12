type Props = {
  title: string;
  date: string;
  location?: string;
  participants: string[];
  totalParticipants?: number;
  rules: string[];
  maxVisibleParticipants?: number;
};

function pluralInvites(n: number) {
  return `${n} invité${n > 1 ? "s" : ""}`;
}

function EventIcon() {
  return (
    <div
      aria-hidden
      className="shrink-0 grid place-items-center size-12 aspect-square rounded-lg bg-[var(--muted)] ring-1 ring-[var(--border)]"
    >
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        stroke="var(--accent-foreground)"
        fill="none"
        strokeWidth="1.6"
      >
        <path d="M3 7c4 2 7-2 11 0s7 2 7 0" />
        <path d="M12 12l1.2 2.6 2.8.2-2.1 1.8.7 2.7L12 18l-2.6 1.3.7-2.7-2.1-1.8 2.8-.2L12 12z" />
      </svg>
    </div>
  );
}

export default function EventPreview({
  title,
  date,
  location,
  participants,
  totalParticipants,
  rules,
  maxVisibleParticipants = 4,
}: Props) {
  const visible = participants.slice(0, maxVisibleParticipants);
  const total = totalParticipants ?? participants.length;
  const hasMore = total > visible.length;
  const meta = [date, location, pluralInvites(total)].filter(Boolean).join(" • ");

  return (
    <article
      aria-label={`Événement ${title}`}
      className="group relative overflow-hidden rounded-2xl bg-[var(--card)] p-5 shadow-soft ring-1 ring-[var(--border)] transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 80% 0%, color-mix(in oklch, var(--accent), white 85%) 0%, transparent 70%)",
          opacity: 0.6,
        }}
      />

      <div className="relative z-10 flex items-start gap-4">
        <EventIcon />

        <div className="min-w-0">
          <h3 className="truncate text-lg font-medium text-[var(--foreground)]">{title}</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{meta}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 items-stretch min-h-[7.5rem]">
            <div className="h-full rounded-lg bg-[var(--muted)] p-3 ring-1 ring-[var(--border)] flex flex-col">
              <p className="text-[11px] font-medium text-[var(--muted-foreground)]">Participants</p>
              <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Participants">
                {visible.map((p) => (
                  <li
                    key={p}
                    className="rounded-full bg-[color-mix(in_oklch,var(--background),black_4%)] px-2 py-[2px] text-xs text-[var(--foreground)] ring-1 ring-[var(--border)]"
                  >
                    {p}
                  </li>
                ))}
                {hasMore && (
                  <li
                    className="rounded-full bg-[color-mix(in_oklch,var(--background),black_4%)] px-2 py-[2px] text-xs text-[var(--foreground)] ring-1 ring-[var(--border)]"
                    aria-label={`et ${total - visible.length} autre(s)`}
                    title={`${total - visible.length} de plus`}
                  >
                    +{total - visible.length}
                  </li>
                )}
              </ul>
            </div>
              
            <div className="h-full rounded-lg bg-[var(--muted)] p-3 ring-1 ring-[var(--border)] flex flex-col">
              <p className="text-[11px] font-medium text-[var(--muted-foreground)]">Règles</p>
              <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Règles">
                {rules.map((r) => (
                  <li
                    key={r}
                    className="rounded-full bg-[color-mix(in_oklch,var(--background),black_4%)] px-2 py-[2px] text-xs text-[var(--foreground)] ring-1 ring-[var(--border)]"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-inner-soft" aria-hidden />
    </article>
  );
}
