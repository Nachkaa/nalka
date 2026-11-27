import { ArrowRight, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

const audiences = [
  { label: "Entre amis", href: "#entre-amis" },
  { label: "Entre collègues", href: "#entre-collegues" },
  { label: "En famille", href: "#en-famille" },
] as const;

export function Hero({ christmasSeason }: { christmasSeason: boolean }) {
  return (
    <section aria-labelledby="homepage-hero-title" className="bg-background overflow-hidden">
      <Container className="px-5 pt-10 pb-6 md:px-6 md:pt-16 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div className="space-y-6 lg:pb-8">
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              {christmasSeason ? "Noël & Secret Santa" : "Les moments à partager"}
            </p>
            <h1
              id="homepage-hero-title"
              className="text-foreground font-serif text-[2.8rem] leading-[1.08] tracking-tight text-balance sm:text-6xl lg:text-[4rem]"
            >
              <span className="block">
                {christmasSeason ? "Un petit cadeau." : "Les bons moments."}
              </span>
              <span className="text-primary mt-1 block italic">
                {christmasSeason ? "Un grand moment." : "À préparer ensemble."}
              </span>
            </h1>
            <p className="text-muted-foreground max-w-md text-base leading-relaxed sm:text-lg">
              {christmasSeason
                ? "Un Secret Santa entre collègues, un Noël entre amis, une fête en famille. Nalka réunit les idées de cadeaux et les préparatifs, pour profiter du moment ensemble."
                : "Un dîner entre amis, une soirée avec les collègues, une fête en famille. Retrouvez les idées et les préparatifs au même endroit, et laissez chacun participer."}
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
                <Button asChild size="lg" className="h-12 rounded-full px-6 text-sm">
                  <Link href={christmasSeason ? "/event/new?occasion=christmas" : "/event/new"}>
                    {christmasSeason ? "Organiser un Secret Santa" : "Créer mon événement"}
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
              <p className="text-muted-foreground text-xs">Pas besoin de compte pour commencer.</p>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 pt-2 text-xs">
              <LockKeyhole className="text-primary size-3.5 shrink-0" aria-hidden />
              Tirage privé, réservations anonymes, surprises préservées.
            </p>
          </div>
          <figure className="min-w-0">
            <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-[1.5rem] lg:aspect-[5/4]">
              <Image
                src={
                  christmasSeason
                    ? "/images/christmas-gift-exchange.webp"
                    : "/images/hero-dinner.webp"
                }
                alt={
                  christmasSeason
                    ? "Des collègues échangent un cadeau lors de leur fête de Noël"
                    : "Des amis réunis pour un moment ensemble"
                }
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="text-muted-foreground mt-4 flex items-start justify-between gap-4 text-xs leading-relaxed">
              <span>
                {christmasSeason
                  ? "Un cadeau change de mains. Le moment se partage."
                  : "Le plaisir de se retrouver, tout simplement."}
              </span>
              <span aria-hidden className="text-primary shrink-0">
                Nalka — ensemble.
              </span>
            </figcaption>
          </figure>
        </div>
        <nav
          aria-label="À chaque groupe son moment"
          className="mt-10 grid grid-cols-1 border-t sm:grid-cols-3 lg:mt-14"
        >
          {audiences.map(({ label, href }, index) => (
            <Link
              key={href}
              href={href}
              className="text-foreground group focus-visible:ring-ring hover:text-primary flex items-center justify-between gap-4 border-b py-4 text-sm focus-visible:ring-2 sm:border-b-0 sm:px-4 sm:py-6 sm:first:pl-0 sm:last:pr-0"
            >
              <span className="flex items-center gap-4">
                <span className="text-muted-foreground text-[10px]">0{index + 1}</span>
                {label}
              </span>
              <ArrowRight
                className="text-muted-foreground size-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          ))}
        </nav>
      </Container>
    </section>
  );
}
