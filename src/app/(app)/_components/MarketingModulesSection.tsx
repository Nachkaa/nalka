import { BarChart3, Gift, ReceiptEuro, Sparkles, Users, Utensils } from "lucide-react";

import { Container } from "@/components/layout/Container";

const features = [
  {
    name: "Les envies de chacun",
    description:
      "Partagez vos idées de cadeaux. Les autres peuvent réserver une attention en gardant la surprise.",
    icon: Gift,
  },
  {
    name: "La magie du tirage",
    description:
      "Entre amis ou collègues, chacun découvre en privé à qui offrir un cadeau. Le Secret Santa peut commencer.",
    icon: Sparkles,
  },
  {
    name: "Les préparatifs à plusieurs",
    description:
      "Qui apporte le dessert, les boissons ou les jeux ? Chacun choisit ce qu'il apporte au bon moment.",
    icon: Utensils,
  },
] as const;

const extras = [
  { label: "Invitations et réponses", icon: Users },
  { label: "Sondages de date ou de lieu", icon: BarChart3 },
  { label: "Dépenses partagées", icon: ReceiptEuro },
] as const;

export function MarketingModulesSection() {
  return (
    <section id="modules-evenement" className="dark:bg-card/30 bg-[#f8f7fa] py-16 md:py-24">
      <Container className="space-y-12 px-5 md:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="max-w-xl space-y-3">
            <p className="text-primary text-xs font-semibold tracking-[0.15em] uppercase">
              Les préparatifs, tout simplement
            </p>
            <h2 className="text-foreground font-serif text-3xl leading-tight text-balance md:text-[2.6rem]">
              Tout ce qu’il faut pour se retrouver.
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            Un événement, les bonnes options, et chacun qui participe à sa façon.
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-3 md:gap-12">
          {features.map(({ name, description, icon: Icon }) => (
            <div key={name} className="border-primary/15 space-y-4 border-t pt-6">
              <Icon className="text-primary size-6" strokeWidth={1.5} aria-hidden />
              <h3 className="text-foreground text-lg font-semibold">{name}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
        <div className="space-y-5 border-t pt-6">
          <ul className="text-muted-foreground flex flex-wrap gap-x-8 gap-y-4 text-xs sm:text-sm">
            {extras.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-xs">
            Listes de cadeaux et Secret Santa fonctionnent ensemble ou séparément. Vous choisissez
            vos options.
          </p>
        </div>
      </Container>
    </section>
  );
}
