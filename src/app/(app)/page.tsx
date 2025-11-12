import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/signin");

  const name = session.user?.name ?? "toi";

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)] antialiased">
      {/* Fil discret = tension narrative de l’événement */}
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 h-[200vh] w-full"
        viewBox="0 0 1440 2000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(90% 0.12 95)" />
            <stop offset="100%" stopColor="oklch(70% 0.10 95)" />
          </linearGradient>
        </defs>
        <path
          d="M 220 0 C 620 120 420 240 820 360 C 1220 480 920 600 540 760 C 160 920 280 1120 740 1280 C 1200 1440 1120 1600 780 1760"
          stroke="url(#gold)"
          strokeWidth="2.5"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* HERO — entrée par l’événement */}
      <section aria-labelledby="hero" className="relative px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h1 id="hero" className="text-balance text-4xl font-semibold sm:text-5xl">
            Bienvenue {name}. Un cadeau est une promesse. <span className="text-[var(--primary)]">Nalka</span> la révèle à l’occasion.
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--muted-foreground)]">
            Commence par un <strong>événement</strong> avec tes proches. Dans cet espace, chacun prépare sa liste. Tu vois ce qu’il reste à offrir, jamais qui a pris.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/events/new"
              className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-[var(--primary-foreground)] font-medium shadow-sm transition-colors hover:bg-[color-mix(in_oklch,var(--primary),black_10%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
            >
              Créer un événement
            </Link>
            <Link
              href="/events"
              className="rounded-2xl bg-[oklch(98%_0.02_95)] px-5 py-3 font-medium text-[var(--foreground)] ring-1 ring-black/10 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Voir mes événements
            </Link>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, color-mix(in oklch, var(--primary), white 92%) 0%, transparent 60%)",
          }}
        />
      </section>

      {/* SCÈNE 1 — Créer l’événement */}
      <section aria-labelledby="scene-1" className="px-6 pb-16 md:px-10">
        <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2">
          <header>
            <h2 id="scene-1" className="text-2xl font-semibold sm:text-3xl">
              Ton événement, votre terrain de jeu
            </h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Donne-lui un nom, une date, invite tes proches. Le cadre est posé, la magie peut agir.
            </p>
            <div className="mt-6">
              <Link
                href="/events/new"
                className="inline-flex items-center rounded-xl bg-[var(--secondary)] px-4 py-2 text-sm font-medium text-[var(--secondary-foreground)] transition-colors hover:bg-[color-mix(in_oklch,var(--secondary),black_7%)] focus-visible:ring-2 focus-visible:ring-black/20"
              >
                Démarrer l’événement
              </Link>
            </div>
          </header>

          {/* Aperçu événement — mini illustration UI */}
          <article
            aria-label="Aperçu d’un événement"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-[oklch(96%_0.02_95)] ring-1 ring-black/5" />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-medium">Noël en famille</h3>
                <p className="text-sm text-[var(--muted-foreground)]">24 décembre • Salon • 8 invités</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-[oklch(98%_0.02_95)] p-3 ring-1 ring-black/5">
                    <p className="text-xs text-[var(--muted-foreground)]">Participants</p>
                    <p className="mt-1 text-sm">Maman, Juliette, Maxime, Alicia…</p>
                  </div>
                  <div className="rounded-lg bg-[oklch(98%_0.02_95)] p-3 ring-1 ring-black/5">
                    <p className="text-xs text-[var(--muted-foreground)]">Règles</p>
                    <p className="mt-1 text-sm">Budget libre • Pas de spoilers</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* SCÈNE 2 — Mystère sans spoiler */}
      <section aria-labelledby="scene-2" className="bg-[oklch(98%_0.02_95)] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <header className="max-w-2xl">
            <h2 id="scene-2" className="text-2xl font-semibold sm:text-3xl">
              La surprise se construit ensemble
            </h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Dans l’événement, chacun propose. Les autres réservent, en silence. Tu vois l’avancement, jamais les noms.
            </p>
          </header>

          {/* Aperçu anti-spoiler orienté événement */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { title: "Écharpe mérinos", state: "taken" },
              { title: "Bougies maison", state: "available" },
              { title: "Porte-cartes cuir", state: "taken" },
              { title: "Carnet pointillé", state: "available" },
            ].map((it) => (
              <article key={it.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-[oklch(96%_0.02_95)] ring-1 ring-black/5" />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-medium">{it.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {it.state === "taken" ? "Déjà pris" : "Disponible"}
                    </p>
                  </div>
                  <span
                    className={[
                      "ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      it.state === "taken"
                        ? "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        : "bg-[var(--primary)] text-[var(--primary-foreground)]",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {it.state === "taken" ? "Pris" : "Offrir"}
                  </span>
                </div>
                {it.state === "taken" && (
                  <div aria-hidden="true" className="mt-3 h-8 rounded-md bg-[oklch(98%_0.02_95)] blur-sm" />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SCÈNE 3 — Après l’événement : listes personnelles dans le cadre */}
      <section aria-labelledby="scene-3" className="px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <header className="max-w-2xl">
            <h2 id="scene-3" className="text-2xl font-semibold sm:text-3xl">
              Ensuite, chacun sa liste
            </h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Dans l’événement, ajoute tes envies. Notes rapides, liens, options. Simple et réutilisable.
            </p>
          </header>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="rounded-2xl px-5 py-3 font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Ouvrir un événement
            </Link>
            <Link
              href="/lists/new"
              className="rounded-2xl bg-[var(--secondary)] px-5 py-3 text-[var(--secondary-foreground)] font-medium shadow-sm transition-colors hover:bg-[color-mix(in_oklch,var(--secondary),black_7%)] focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Ajouter ma liste à l’événement
            </Link>
          </div>

          {/* Micro-aperçu cartes de souhaits */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Mug en grès", note: "Couleur mousse" },
              { title: "Gants vélo hiver", note: "Doigts tactiles" },
              { title: "Roman illustré", note: "Édition reliée" },
            ].map((c) => (
              <article key={c.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-[oklch(96%_0.02_95)] ring-1 ring-black/5" />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-medium">{c.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{c.note}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SCÈNE 4 — Appel à l’action focalisé événement */}
      <section aria-labelledby="scene-4" className="bg-[oklch(98%_0.02_95)] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <h2 id="scene-4" className="text-2xl font-semibold sm:text-3xl">Tout commence par un événement</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--muted-foreground)]">
            Crée l’espace, invite deux proches, ajoute une idée chacun. Le reste suivra.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/events/new"
              className="rounded-2xl bg-[var(--primary)] px-6 py-3 text-[var(--primary-foreground)] font-medium shadow-sm transition-colors hover:bg-[color-mix(in_oklch,var(--primary),black_10%)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
            >
              Créer un événement
            </Link>
            <Link
              href="/events"
              className="rounded-2xl px-6 py-3 font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Voir mes événements
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
