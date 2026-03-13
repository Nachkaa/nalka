import { Cake, Plane, ShieldCheck, Smartphone, TreePine, Users } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  { icon: Users, label: "Pensé pour des groupes privés" },
  { icon: ShieldCheck, label: "La confidentialité par design" },
  { icon: Smartphone, label: "Mobile + desktop" },
] as const;

const examples = [
  {
    title: "Anniversaire",
    description: "RSVP, réservations de cadeaux, dépenses partagées",
    chips: ["Aperçu", "Cadeaux", "Dépenses"],
    icon: Cake,
    gradientFrom: "#FF2D87",
    gradientTo: "#FF4F7B",
  },
  {
    title: "Noël en famille",
    description: "Planning, Secret Santa, repas partagé",
    chips: ["Planning", "Secret Santa", "Repas partagé"],
    icon: TreePine,
    gradientFrom: "#00C38A",
    gradientTo: "#00B07D",
  },
  {
    title: "Voyage entre amis",
    description: "Itinéraire, dépenses, infos pratiques",
    chips: ["Planning", "Dépenses", "Aperçu"],
    icon: Plane,
    gradientFrom: "#0B84FF",
    gradientTo: "#08B0FF",
  },
] as const;

export function MarketingExamplesSection() {
  return (
    <section id="idees-evenements" className="bg-background py-20 md:py-24">
      <Container className="flex flex-col gap-10 md:gap-12">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className="border-border/70 rounded-2xl border bg-white! py-2! shadow-sm"
              >
                <CardContent className="flex items-center gap-3 px-4 py-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-(--primary-600) to-(--primary-500) text-white shadow-sm">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <span className="text-foreground text-sm font-medium">{item.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-3 text-center">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Exemples d’événements
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Découvrez comment Nalka s’adapte à différentes occasions
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {examples.map((example) => {
            const Icon = example.icon;
            return (
              <Card
                key={example.title}
                className="group border-border/70 shadow-3xl hover:border-primary/30 h-full rounded-2xl border bg-white! py-0! transition-all duration-200 ease-out hover:shadow-[0_18px_60px_-40px_rgba(0,0,0,0.35)]"
              >
                <div
                  className="relative flex h-28 w-full items-center justify-center rounded-t-2xl text-white md:h-32"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${example.gradientFrom}, ${example.gradientTo})`,
                  }}
                >
                  <div
                    className="absolute -top-8 -left-6 h-24 w-24 rounded-full bg-white/10"
                    aria-hidden
                  />
                  <div
                    className="absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-white/10"
                    aria-hidden
                  />
                  <Icon
                    className="h-12 w-12 transition-transform duration-200 ease-out group-hover:scale-105"
                    aria-hidden
                  />
                </div>

                <CardContent className="space-y-3 px-5 pb-4">
                  <div className="space-y-1">
                    <p className="text-foreground text-base font-semibold">{example.title}</p>
                    <p className="text-muted-foreground text-sm">{example.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {example.chips.map((chip) => (
                      <span
                        key={chip}
                        className="bg-muted text-foreground/80 ring-border/60 rounded-full px-3 py-1 text-xs font-medium ring-1"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
