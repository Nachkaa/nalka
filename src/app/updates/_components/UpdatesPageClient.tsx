"use client";

import Image from "next/image";
import { Bug, Sparkles, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ReleaseNote, ReleaseNoteSectionKey } from "@/content/release-notes";

type FilterKey = "all" | ReleaseNoteSectionKey;

const sectionLabels: Record<ReleaseNoteSectionKey, string> = {
  new: "Nouveau",
  improved: "Amélioré",
  fixed: "Corrigé",
};

const sectionIcons: Record<ReleaseNoteSectionKey, typeof Sparkles> = {
  new: Sparkles,
  improved: Wrench,
  fixed: Bug,
};

const sectionPriority: ReleaseNoteSectionKey[] = ["new", "improved", "fixed"];

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "new", label: "Nouveau" },
  { key: "improved", label: "Amélioré" },
  { key: "fixed", label: "Corrigé" },
];

function matchesFilter(note: ReleaseNote, filter: FilterKey) {
  if (filter === "all") return true;
  return note.sections[filter].length > 0;
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted-foreground)] uppercase">
      {children}
    </p>
  );
}

function NoteTag({ children, subtle = false }: { children: React.ReactNode; subtle?: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={
        subtle
          ? "border-0 bg-white/88 text-[var(--foreground)] backdrop-blur"
          : "border border-primary/15 bg-primary/8 text-primary shadow-none"
      }
    >
      {children}
    </Badge>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        active
          ? "border-primary/20 bg-primary/10 text-primary shadow-sm"
          : "border-[var(--border)] bg-white/88 text-[var(--muted-foreground)] hover:border-primary/12 hover:bg-white hover:text-[var(--foreground)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function NoteSections({
  note,
  compact = false,
  featured = false,
}: {
  note: ReleaseNote;
  compact?: boolean;
  featured?: boolean;
}) {
  const keys = sectionPriority.filter((key) => note.sections[key].length > 0);

  if (keys.length === 0) return null;

  return (
    <div className={featured || compact ? "space-y-4" : "grid gap-5 md:grid-cols-3"}>
      {keys.map((key, index) => {
        const Icon = sectionIcons[key];
        const isStacked = featured || compact;

        return (
          <div
            key={key}
            className={
              isStacked
                ? index === 0
                  ? ""
                  : "pt-3"
                : "rounded-2xl border border-[color-mix(in_oklch,var(--border),var(--primary)_10%)] bg-[linear-gradient(180deg,white_0%,color-mix(in_oklch,var(--primary),white_96%)_100%)] px-4 py-4"
            }
          >
            <div className="flex items-center gap-2 text-[var(--foreground)]">
              <Icon className={featured ? "size-4.5 text-primary" : "size-4 text-primary"} aria-hidden />
              <h3 className={featured ? "text-base font-semibold" : "text-sm font-semibold"}>
                {sectionLabels[key]}
              </h3>
            </div>

            <ul
              className={
                featured
                  ? "mt-3 space-y-2.5 text-[15px] leading-7 text-[var(--muted-foreground)]"
                  : "mt-3 space-y-2.5 text-sm leading-6 text-[var(--muted-foreground)]"
              }
            >
              {note.sections[key].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function FeaturedRelease({ note }: { note: ReleaseNote }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border border-[color-mix(in_oklch,var(--border),var(--primary)_10%)] bg-white/96 py-0 shadow-[0_28px_90px_-52px_rgba(36,24,75,0.38)]">
      <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-primary/20 bg-primary/10 text-primary shadow-none">
                Mise en avant
              </Badge>
              <SectionEyebrow>{note.dateLabel}</SectionEyebrow>
            </div>

            <div className="space-y-4">
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-[3.3rem] md:leading-[1.02]">
                {note.title}
              </h2>
              <p className="max-w-2xl text-base leading-8 text-[var(--muted-foreground)] md:text-lg">
                {note.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <NoteTag key={tag}>{tag}</NoteTag>
              ))}
            </div>

            <NoteSections note={note} featured />
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden bg-[color-mix(in_oklch,var(--primary),white_93%)] lg:min-h-[100%]">
          <Image
            src={note.heroImage}
            alt={note.title}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,20,69,0.06)_0%,rgba(31,20,69,0.24)_100%)]" />
        </div>
      </div>
    </Card>
  );
}

function LatestReleaseCard({ note }: { note: ReleaseNote }) {
  return (
    <Card className="group overflow-hidden rounded-[1.75rem] border border-[color-mix(in_oklch,var(--border),var(--primary)_8%)] bg-white/96 py-0 shadow-sm transition hover:-translate-y-px hover:shadow-[0_18px_60px_-42px_rgba(36,24,75,0.2)]">
      <div className="grid gap-0">
        <div className="relative min-h-[220px] overflow-hidden bg-[color-mix(in_oklch,var(--primary),white_93%)]">
          <Image
            src={note.heroImage}
            alt={note.title}
            fill
            sizes="(min-width: 1024px) 28vw, 100vw"
            className="object-cover object-center transition duration-300 group-hover:scale-[1.015]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/28 via-black/5 to-transparent" />
          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <NoteTag key={tag} subtle>
                {tag}
              </NoteTag>
            ))}
          </div>
        </div>

        <div className="space-y-5 p-6 md:p-7">
          <SectionEyebrow>{note.dateLabel}</SectionEyebrow>

          <div className="space-y-3">
            <h3 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {note.title}
            </h3>
            <p className="text-base leading-7 text-[var(--muted-foreground)]">{note.summary}</p>
          </div>

          <NoteSections note={note} compact />
        </div>
      </div>
    </Card>
  );
}

export function UpdatesPageClient({ notes }: { notes: ReleaseNote[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredNotes = useMemo(
    () => notes.filter((note) => matchesFilter(note, filter)),
    [filter, notes],
  );

  const featuredNote = filteredNotes[0];
  const remainingNotes = filteredNotes.slice(1);

  return (
    <div className="py-10 md:py-14">
      <Container className="space-y-12 md:space-y-16">
        <section className="relative isolate space-y-5 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-12 h-40 opacity-80" />
          <Badge className="border-primary/20 bg-primary/10 text-primary shadow-none">
            Notes de version
          </Badge>
          <div className="relative max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] md:text-5xl">
              Les dernières évolutions de Nalka
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[var(--muted-foreground)] md:text-lg">
              Suivez les améliorations produit, les nouveaux modules et les corrections livrées pour
              rendre l&apos;organisation d&apos;événements privés plus claire, plus simple et plus fiable.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <FilterChip
                key={item.key}
                label={item.label}
                active={item.key === filter}
                onClick={() => setFilter(item.key)}
              />
            ))}
          </div>
        </section>

        {featuredNote ? (
          <section className="space-y-4 md:space-y-5">
            <div className="space-y-1">
              <SectionEyebrow>Dernières mises à jour</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">À la une</h2>
            </div>
            <FeaturedRelease note={featuredNote} />
          </section>
        ) : null}

        {remainingNotes.length > 0 ? (
          <section className="space-y-4 md:space-y-5">
            <div className="space-y-1">
              <SectionEyebrow>Historique produit</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Toutes les mises à jour
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {remainingNotes.map((note) => (
                <LatestReleaseCard key={note.slug} note={note} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </div>
  );
}
