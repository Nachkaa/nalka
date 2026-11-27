import { Container } from "@/components/layout/Container";

const steps = [
  {
    title: "Donnez-lui un nom",
    description:
      "Un Secret Santa de l’équipe, Noël entre amis… La date et le lieu peuvent encore attendre.",
  },
  {
    title: "Invitez votre groupe",
    description:
      "Partagez votre lien avec vos amis, vos collègues ou votre famille. Chacun rejoint le même événement.",
  },
  {
    title: "Préparez-le ensemble",
    description:
      "Choisissez vos options : cadeaux, tirage au sort, repas partagé ou dépenses du groupe.",
  },
] as const;

export function MarketingHowItWorksSection() {
  return (
    <section id="fonctionnement" className="bg-background py-16 md:py-24">
      <Container className="space-y-12 px-5 md:px-6">
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <p className="text-primary text-xs font-semibold tracking-[0.15em] uppercase">
            De l’idée au bon moment
          </p>
          <h2 className="text-foreground font-serif text-3xl leading-tight text-balance md:text-[2.6rem]">
            On commence simplement.
          </h2>
        </div>
        <ol className="grid gap-8 md:grid-cols-3 md:gap-12">
          {steps.map(({ title, description }, index) => (
            <li key={title} className="space-y-4 border-t pt-6">
              <span className="text-primary/60 block font-serif text-3xl">0{index + 1}</span>
              <h3 className="text-foreground text-base font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground text-center text-xs">
          Vous ajoutez seulement les options utiles à votre groupe.
        </p>
      </Container>
    </section>
  );
}
