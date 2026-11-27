import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

const occasions = [
  {
    id: "entre-amis",
    title: "Entre amis",
    description:
      "Un dîner, un Secret Santa, un week-end. On partage les idées, les envies et les préparatifs.",
    image: "/images/hero-dinner.webp",
    alt: "Des amis profitent d'un moment ensemble à la maison",
    position: "object-center",
    caption: "Les habitudes qu’on aime retrouver.",
  },
  {
    id: "entre-collegues",
    title: "Entre collègues",
    description:
      "Un petit cadeau, une pause dans la journée, un moment à partager avec les personnes que l’on côtoie toute l’année.",
    image: "/images/christmas-gift-exchange.webp",
    alt: "Des collègues échangent leurs cadeaux de Noël",
    position: "object-center",
    caption: "Un peu de fête dans le quotidien.",
  },
  {
    id: "en-famille",
    title: "En famille",
    description:
      "Noël, les anniversaires, les retrouvailles. Chacun apporte sa petite touche, et les souvenirs se créent ensemble.",
    image: "/images/usecases/birthday.webp",
    alt: "Une personne apporte un gâteau d'anniversaire à partager",
    position: "object-[center_65%]",
    caption: "Les occasions qui nous rassemblent.",
  },
] as const;

export function MarketingExamplesSection() {
  return (
    <section id="idees-evenements" className="bg-background py-16 md:py-24">
      <Container className="space-y-12 px-5 md:px-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-primary text-xs font-semibold tracking-[0.15em] uppercase">
            Votre groupe, votre moment
          </p>
          <h2 className="text-foreground font-serif text-3xl leading-tight text-balance md:text-[2.6rem]">
            On a tous une bonne raison de se retrouver.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Entre amis, entre collègues, en famille. Nalka vous accompagne aussi après les fêtes.
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-3 md:gap-7">
          {occasions.map(({ id, title, description, image, alt, position, caption }, index) => (
            <article id={id} key={id} className="scroll-mt-8 space-y-4">
              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={image}
                  alt={alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className={`object-cover ${position}`}
                />
              </div>
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-muted-foreground text-[10px]">0{index + 1}</span>
                <h3 className="text-foreground font-serif text-2xl">{title}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              <p className="text-muted-foreground border-t pt-3 text-xs italic">{caption}</p>
            </article>
          ))}
        </div>
        <div className="flex flex-col gap-5 border-t pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground font-serif text-2xl">
            Et le prochain moment, c’est avec qui ?
          </p>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/event/new">
              Créer notre événement
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
