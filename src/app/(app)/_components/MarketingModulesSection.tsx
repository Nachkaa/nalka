import { BarChart3, Gift, ReceiptEuro, Sparkles, Users, Utensils } from "lucide-react";

import { Container } from "@/components/layout/Container";

const features = [
  {
    name: "Des cadeaux qui font plaisir",
    description:
      "Chacun partage ses envies. Les proches réservent les cadeaux en gardant la surprise.",
    icon: Gift,
  },
  {
    name: "Un Secret Santa entre proches",
    description:
      "Lancez le tirage au sort. Chaque personne découvre en privé à qui offrir un cadeau.",
    icon: Sparkles,
  },
  {
    name: "Qui apporte quoi ?",
    description: "Le dessert, les boissons, les jeux… Répartissez ce que chacun apporte.",
    icon: Utensils,
  },
  {
    name: "Savoir qui sera là",
    description: "Invitez vos proches et retrouvez leurs réponses sans multiplier les relances.",
    icon: Users,
  },
  {
    name: "Choisir ensemble",
    description: "Une hésitation sur la date ou le lieu ? Proposez un sondage au groupe.",
    icon: BarChart3,
  },
  {
    name: "Partager les dépenses",
    description: "Notez qui a payé quoi et retrouvez les remboursements à faire entre vous.",
    icon: ReceiptEuro,
  },
] as const;

export function MarketingModulesSection() {
  return (
    <section id="modules-evenement" className="bg-background py-12 md:py-20">
      <Container className="space-y-10">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Un peu moins à gérer. Un peu plus à partager.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Les préparatifs avancent à plusieurs, avec les options dont votre groupe a besoin.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ name, description, icon: Icon }) => (
            <div key={name} className="bg-card space-y-4 rounded-2xl border p-6">
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="space-y-2">
                <h3 className="text-foreground font-semibold">{name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-center text-sm">
          Listes de cadeaux et Secret Santa fonctionnent ensemble ou séparément. Vous choisissez.
        </p>
      </Container>
    </section>
  );
}
