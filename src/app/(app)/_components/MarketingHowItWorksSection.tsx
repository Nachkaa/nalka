import { Plus, Share2, SlidersHorizontal } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    step: "1",
    title: "Créez l’événement",
    description: "Ajoutez le nom, la date et le lieu. En 30 secondes, c’est prêt.",
    icon: Plus,
  },
  {
    step: "2",
    title: "Invitez par lien",
    description: "Partagez un lien privé. Connexion par e-mail, sans mot de passe",
    icon: Share2,
  },
  {
    step: "3",
    title: "Activez les modules",
    description: "Cadeaux, Secret Santa, Repas partagé, Dépenses… uniquement ce qui vous sert.",
    icon: SlidersHorizontal,
  },
] as const;

export function MarketingHowItWorksSection() {
  return (
    <section className="relative py-10 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--primary-100),transparent_70%)]"
      />
      <div aria-hidden className="bg-background/80 pointer-events-none absolute inset-0" />

      <Container className="relative flex flex-col gap-10 md:gap-12">
        <div className="space-y-3 text-center">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Comment ça fonctionne
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Trois étapes. Zéro complexité.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.step} className="relative h-full">
                <Card
                  className={[
                    "border-border/70 h-full rounded-2xl border bg-white!",
                    "shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out",
                    "hover:border-primary/35",
                    "hover:bg-(--primary-100)! hover:shadow-[0_14px_36px_-20px_rgba(0,0,0,0.35)]",
                    "hover:cursor-pointer",
                  ].join(" ")}
                >
                  <CardHeader className="space-y-5">
                    <div className="flex flex-col items-start gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-(--primary-600) to-(--primary-500) text-xs font-semibold text-white shadow-sm">
                        {step.step}
                      </span>

                      <span className="bg-primary/10 text-primary ring-primary/15 flex h-11 w-11 items-center justify-center rounded-xl ring-1">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                    </div>

                    <div className="space-y-2 text-left">
                      <CardTitle className="text-foreground text-lg font-semibold">
                        {step.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                        {step.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex w-full justify-center">
          <div className="border-primary/15 bg-primary/10 text-foreground/90 flex w-full max-w-3xl items-center justify-center gap-3 rounded-2xl border px-5 py-3 text-sm">
            <span aria-hidden className="text-base">
              💡
            </span>
            <span className="text-center">
              <span className="text-foreground font-semibold">Les modules sont optionnels</span>
              <span className="text-muted-foreground mx-2">—</span>
              <span className="text-muted-foreground">
                commencez simple, puis activez au besoin.
              </span>
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
