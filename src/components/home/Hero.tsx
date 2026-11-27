import { ArrowRight, Gift, LockKeyhole, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export function Hero({ christmasSeason }: { christmasSeason: boolean }) {
  return (
    <section
      aria-labelledby="homepage-hero-title"
      className="dark:bg-background overflow-hidden bg-[#fcf8f3]"
    >
      <Container className="grid items-center gap-10 px-5 py-10 md:px-6 md:py-16 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-6">
          <p className="text-primary text-sm font-semibold">
            {christmasSeason
              ? "Noël en famille ou entre amis"
              : "Les bons moments se préparent ensemble"}
          </p>
          <h1
            id="homepage-hero-title"
            className="text-foreground max-w-xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {christmasSeason
              ? "Cette année, préparez Noël ensemble."
              : "Plus de moments ensemble. Moins de choses à penser."}
          </h1>
          <p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
            {christmasSeason
              ? "Les idées de cadeaux, le Secret Santa, qui apporte le dessert… Retrouvez tout au même endroit et laissez chacun participer."
              : "Un anniversaire, un repas, un week-end entre amis… Rassemblez vos proches, partagez les idées et répartissez les préparatifs avec Nalka."}
          </p>
          <div className="space-y-3">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base">
                <Link href={christmasSeason ? "/event/new?occasion=christmas" : "/event/new"}>
                  {christmasSeason ? "Préparer mon Noël" : "Créer mon événement"}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Link
                href="#fonctionnement"
                className="text-foreground focus-visible:ring-ring rounded-md py-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2"
              >
                Comment ça marche ?
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">Pas besoin de compte pour commencer.</p>
          </div>
          <ul className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-3 pt-2 text-sm">
            <li className="flex items-center gap-2">
              <Users className="text-primary size-4" aria-hidden />
              Vos proches réunis
            </li>
            <li className="flex items-center gap-2">
              <Gift className="text-primary size-4" aria-hidden />
              Chacun participe
            </li>
            <li className="flex items-center gap-2">
              <LockKeyhole className="text-primary size-4" aria-hidden />
              Surprises préservées
            </li>
          </ul>
        </div>

        <div className="relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] sm:aspect-[6/5]">
            <Image
              src="/images/hero-dinner.webp"
              alt="Des proches réunis à la maison pour partager un moment ensemble"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[45%_center]"
            />
          </div>
          <div className="bg-card relative mx-4 -mt-14 rounded-2xl border p-5 shadow-lg sm:mx-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-primary text-xs font-semibold">Votre prochain moment ensemble</p>
              <span className="text-muted-foreground text-xs">Exemple</span>
            </div>
            <p className="text-foreground mt-2 text-xl font-semibold">
              {christmasSeason ? "Noël en famille" : "Un week-end entre amis"}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {christmasSeason
                ? "Les envies de chacun, un tirage au sort et un repas à préparer ensemble."
                : "Une date à choisir, des idées à partager et des dépenses à répartir."}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
