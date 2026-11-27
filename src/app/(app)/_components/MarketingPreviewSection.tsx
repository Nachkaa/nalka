import { Calendar, Gift, LockKeyhole, MapPin, Utensils } from "lucide-react";

import { Container } from "@/components/layout/Container";

const preparations = [
  {
    icon: Gift,
    title: "Les idées de cadeaux",
    description: "Chacun complète sa liste d'envies pour aider ses proches.",
  },
  {
    icon: Utensils,
    title: "Le repas se prépare à plusieurs",
    description: "Une entrée, le dessert, les boissons : chacun peut apporter quelque chose.",
  },
  {
    icon: LockKeyhole,
    title: "Le Secret Santa reste secret",
    description: "Chaque personne consulte uniquement sa propre attribution.",
  },
] as const;

export function MarketingPreviewSection() {
  return (
    <section id="espace-prive" className="dark:bg-background bg-[#fcf8f3] py-12 md:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="space-y-4">
          <p className="text-primary text-sm font-semibold">Par exemple, pour Noël</p>
          <h2 className="text-foreground text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            « On a mis toutes les infos sur Nalka. »
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            La date, le lieu, les cadeaux et ce que chacun apporte : vos proches savent où retrouver
            les informations. La personne qui organise peut aussi souffler un peu.
          </p>
        </div>
        <div className="bg-card overflow-hidden rounded-3xl border shadow-sm">
          <div className="border-b p-6 sm:p-8">
            <p className="text-muted-foreground text-xs">Exemple d&apos;événement</p>
            <h3 className="text-foreground mt-2 text-2xl font-semibold">Noël en famille</h3>
            <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="size-4" aria-hidden />
                24/12 · 19 h
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="size-4" aria-hidden />À la maison
              </span>
            </div>
          </div>
          <ul className="divide-y px-6 sm:px-8">
            {preparations.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4 py-5">
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="space-y-1">
                  <p className="text-foreground text-sm font-semibold">{title}</p>
                  <p className="text-muted-foreground text-sm">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
