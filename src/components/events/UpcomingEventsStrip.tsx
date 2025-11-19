import Link from "next/link";

type UpcomingEvent = {
  id: string;
  slug: string;
  title: string;
  eventOn: Date;
  location: string | null;
};

type Props = {
  events: UpcomingEvent[];
};

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDiffLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Aujourd’hui";
  if (diffDays === 1) return "Demain";
  if (diffDays > 1 && diffDays <= 30) return `J-${diffDays}`;

  return null;
}

export function UpcomingEventsStrip({ events }: Props) {
  if (!events.length) return null;

  return (
    <section
      aria-label="Tes prochains moments"
      className="border-b border-[color-mix(in_oklch,var(--cream),black_4%)] bg-[color-mix(in_oklch,var(--cream),black_2%)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--forest-strong,oklch(25%_0.03_170))]">
            Tes prochains moments
          </h2>
        </div>

        <div
          className="
            flex gap-3 overflow-x-auto pb-1
            snap-x snap-mandatory
            [touch-action:pan-x]
          "
        >
          {events.map((event) => {
            const label = formatDiffLabel(event.eventOn);

            return (
              <Link
                key={event.id}
                href={`/event/${event.slug}`}
                className="
                  w-[260px]
                  shrink-0
                  rounded-xl
                  border border-[color-mix(in_oklch,var(--cream),black_6%)]
                  bg-white/90
                  px-3 py-3
                  text-sm text-forest
                  shadow-sm
                  transition
                  hover:border-[var(--primary)]
                  hover:bg-white
                "
              >
                {/* Ligne titre */}
                <p className="line-clamp-1 font-medium">
                  {event.title}
                </p>

                {/* Ligne date + J-… + lieu */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-primary)]">
                  <span>{formatEventDate(event.eventOn)}</span>

                  {label && (
                    <span className="rounded-full bg-[color-mix(in_oklch,var(--primary),white_15%)] px-2 py-0.5 text-[11px] font-medium text-white">
                      {label}
                    </span>
                  )}

                  {event.location && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="line-clamp-1">{event.location}</span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
