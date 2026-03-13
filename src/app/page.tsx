import { Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { MarketingExamplesSection } from "@/app/(app)/_components/MarketingExamplesSection";
import { MarketingHowItWorksSection } from "@/app/(app)/_components/MarketingHowItWorksSection";
import { MarketingModulesSection } from "@/app/(app)/_components/MarketingModulesSection";
import { MarketingPreviewSection } from "@/app/(app)/_components/MarketingPreviewSection";
import { MarketingPrivacySection } from "@/app/(app)/_components/MarketingPrivacySection";
import { Container } from "@/components/layout/Container";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { StructuredData } from "@/components/seo/StructuredData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { absoluteUrl, buildPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicMetadata({
  title: "Organisation d'evenements prives et listes cadeaux",
  description:
    "Organisez un evenement prive avec invitations, cadeaux, Secret Santa et depenses dans un espace clair, discret et sans spoiler.",
  path: "/",
});

function MockEventCard() {
  return (
    <div
      id="demo-evenement"
      className="card shadow-soft w-full max-w-[520px] rounded-2xl border bg-[linear-gradient(180deg,white_0%,color-mix(in_oklch,var(--primary),white_94%)_100%)] p-5"
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-foreground font-semibold">Vos événements</span>
        <span className="rounded-full bg-[color-mix(in_oklch,var(--primary),white_78%)] px-3 py-1 text-xs font-semibold text-[color-mix(in_oklch,var(--primary),black_8%)]">
          3 en cours
        </span>
      </div>

      <div className="mt-4 rounded-xl border bg-[color-mix(in_oklch,var(--primary),white_92%)]/80 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-foreground text-sm font-semibold">Anniversaire d&apos;Emma</p>
            <p className="text-muted-foreground text-xs">Sam 15 fév · 19h00</p>
          </div>
          <span className="bg-foreground text-background rounded-full px-3 py-1 text-[11px] font-semibold">
            Hôte
          </span>
        </div>

        <div className="text-muted-foreground mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-[11px] tracking-[0.03em]">Participants</p>
            <p className="text-foreground text-base font-semibold">12 / 15</p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.03em]">Cadeaux</p>
            <p className="text-foreground text-base font-semibold">8 réservés</p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.03em]">Budget</p>
            <p className="text-foreground text-base font-semibold">20 €</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingHomePage() {
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Organisation d'evenements prives et listes cadeaux",
          url: absoluteUrl("/"),
          description:
            "Organisez un evenement prive avec invitations, cadeaux, Secret Santa et depenses dans un espace clair, discret et sans spoiler.",
        }}
      />
      <MarketingNavbar />

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_15%_20%,color-mix(in_oklch,var(--primary),white_86%)_0%,transparent_52%),radial-gradient(90%_60%_at_85%_0%,color-mix(in_oklch,var(--primary),white_90%)_0%,transparent_48%),linear-gradient(to_bottom,white_0%,color-mix(in_oklch,var(--background),black_2%)_55%,var(--background)_100%)]" />

        <div className="absolute inset-x-0 -top-8 h-20 bg-linear-to-b from-white/40 via-white/15 to-transparent" />

        <Container className="relative flex flex-col gap-10 py-12 md:py-16 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
            <div className="space-y-6">
              <h1 className="text-foreground text-2xl leading-tight font-semibold tracking-tight md:text-5xl lg:text-[2.5rem]">
                Créez un événement privé en toute simplicité.
              </h1>
              <p className="text-muted-foreground max-w-xl text-lg">
                Activez uniquement ce dont vous avez besoin — Liste des présents, cadeaux, Secret
                Santa, suivi des dépenses… Tout au même endroit.
              </p>

              <div className="space-y-2.5">
                <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="sr-only" htmlFor="email">
                    E-mail
                  </label>
                  <div className="shadow-soft ring-border flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2 ring-1 sm:max-w-md">
                    <Mail className="text-muted-foreground size-5" aria-hidden />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Votre adresse e-mail"
                      className="h-8 flex-1 border-0 px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                    />
                  </div>

                  <Button
                    asChild
                    size="lg"
                    className="shadow-soft h-12 rounded-xl bg-(--primary) px-6 text-base text-(--primary-foreground) hover:bg-[color-mix(in_oklch,var(--primary),black_8%)]"
                  >
                    <Link href="/event/new">Créer votre événement</Link>
                  </Button>
                </form>

                <p className="text-muted-foreground text-sm">
                  Aucun mot de passe. Connexion par lien magique sécurisé.
                </p>
                <nav aria-label="Acces rapides" className="flex flex-wrap gap-3 text-sm">
                  <Link
                    href="#fonctionnement"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    Voir comment creer un evenement prive
                  </Link>
                  <Link
                    href="#modules-evenement"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    Decouvrir les modules cadeaux, Secret Santa et depenses
                  </Link>
                  <Link
                    href="#idees-evenements"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    Explorer des exemples d'evenements prives
                  </Link>
                </nav>
              </div>
            </div>

            <div className="flex justify-center lg:justify-center lg:pt-6">
              <MockEventCard />
            </div>
          </div>
        </Container>
      </section>

      <MarketingPreviewSection />
      <MarketingModulesSection />
      <MarketingHowItWorksSection />
      <MarketingPrivacySection />
      <MarketingExamplesSection />
    </>
  );
}
