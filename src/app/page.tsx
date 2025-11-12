import Link from "next/link";
import EventPreview from "@/components/blocks/EventPreview";
import StorySteps from "@/components/blocks/StorySteps";
import GoldLine from "@/components/decor/GoldLine";
import { formatRule, Rule } from "@/domain/rules";
import Container from "@/components/layout/Container";

export default function Page() {
  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)] antialiased">
      {/* HERO */}
      <section aria-labelledby="hero" className="relative overflow-hidden bg-[var(--background)]">
        <Container className="py-20">
          <div className="max-w-2xl">
            <h1 id="hero" className="text-balance text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
              Préparez vos événements ensemble.
            </h1>
            <p className="text-2xl mt-4 text-[var(--muted-foreground)]">
              <span className="text-[var(--primary)]">Nalka</span> simplifie l'organisations de tes moments partagés.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/event/new"
                className="rounded-2xl bg-[var(--primary)] px-5 py-3 font-medium text-[var(--primary-foreground)] shadow-sm transition-all hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Créer un événement
              </Link>
              <Link
                href="/event"
                className="rounded-2xl px-5 py-3 font-medium ring-1 ring-[var(--border)] text-[var(--foreground)] hover:bg-[color-mix(in_oklch,var(--background),black_4%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Voir mes événements
              </Link>
               <Link
                href="/event/new?mode=santa"
                className="rounded-2xl px-5 py-3 font-medium ring-1 ring-[var(--border)] text-[var(--foreground)] hover:bg-[color-mix(in_oklch,var(--background),black_4%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Lancer un Secret&nbsp;Santa
              </Link>
            </div>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">Invitez qui vous voulez.</p>
          </div>
        </Container>
        <GoldLine className="pointer-events-none absolute inset-0 -z-10" />
      </section>

      {/* EXEMPLES */}
      <section className="mt-12 mb-10 md:mb-12">
        <Container className="space-y-4">
          <h2 className="text-2xl font-semibold sm:text-3xl text-[var(--foreground)]">Exemples d’événements</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(() => {
              const rulesNoel: Rule[] = [
                { key: "noSpoil" },
                { key: "budgetCap", value: 30 },
                { key: "secondHandOk" },
              ];
              return (
                <EventPreview
                  title="Noël en famille"
                  date="25 décembre"
                  location="Chez les parents"
                  totalParticipants={10}
                  participants={["Maman", "Papa", "Roxanne", "Kira"]}
                  rules={rulesNoel.map(formatRule)}
                />
              );
            })()}
            {(() => {
              const rulesAnniv: Rule[] = [{ key: "noSpoil" }, { key: "secondHandOk" }];
              return (
                <EventPreview
                  title="Nos 3 ans"
                  date="7 juillet"
                  location="Nice"
                  totalParticipants={2}
                  participants={["Mon Cœur ❤️"]}
                  rules={rulesAnniv.map(formatRule)}
                />
              );
            })()}
          </div>
        </Container>
      </section>

      {/* STORYTELLING */}
      <section
        aria-labelledby="how"
        className="border-t border-[var(--border)] bg-[color-mix(in_oklch,var(--background),white_3%)]"
      >
        <Container className="py-16">
          <h2 id="scene-1" className="text-2xl font-semibold sm:text-3xl">
            L’événement, le point de départ.
          </h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Choisis une occasion, invite ta famille ou tes amis. Chacun partage ses idées et la magie opère naturellement.
          </p>
          <div className="mt-8">
            <StorySteps />
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section aria-labelledby="cta" className="relative overflow-hidden bg-[var(--primary)]">
        <Container className="py-20 text-center">
          <h2 id="cta" className="text-2xl font-semibold text-[var(--primary-foreground)] sm:text-3xl">
            Tout commence ici.
          </h2>
          <p className="mx-auto mt-3 max-w-prose text-[oklch(96%_0.01_110)]">
            Crée un espace, invite ceux que tu aimes et lance le moment qui fera plaisir à tout le monde.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/event/new"
              className="rounded-2xl bg-white px-6 py-3 font-medium text-[var(--primary)] shadow-sm transition-all hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Créer un événement
            </Link>
            <Link
              href="/event"
              className="rounded-2xl bg-white/10 px-6 py-3 font-medium text-white ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Voir mes événements
            </Link>
          </div>
        </Container>
        <GoldLine className="pointer-events-none absolute inset-0 -z-10 opacity-70 [filter:brightness(0.9)]" />
      </section>
    </main>
  );
}
