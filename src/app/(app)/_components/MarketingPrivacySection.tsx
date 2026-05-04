import { EyeOff, Lock, Shield, UserCheck } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  {
    icon: Lock,
    title: "Budget et devis restent côté organisateur",
    description: "Les participants ne voient pas les montants, notes internes ou arbitrages.",
  },
  {
    icon: UserCheck,
    title: "Accès événement contrôlé",
    description: "Les invitations et modules actifs cadrent ce que chaque personne peut consulter.",
  },
  {
    icon: EyeOff,
    title: "Pas d'activité inutilement exposée",
    description: "Nalka évite les signaux qui pourraient révéler des informations sensibles.",
  },
  {
    icon: Shield,
    title: "Confidentialité des réservations préservée",
    description: "Les flux cadeaux gardent leurs protections anti-spoiler et anonymes.",
  },
] as const;

export function MarketingPrivacySection() {
  return (
    <section
      id="confidentialite-privee"
      className="relative isolate overflow-hidden bg-[#0b0b10] py-10 md:py-18"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-20 left-[25%] h-[520px] w-[720px] opacity-45"
          style={{
            background:
              "radial-gradient(60% 60% at 35% 35%, var(--primary-600) 0%, transparent 65%)",
          }}
        />

        <div
          className="absolute -bottom-56 left-[55%] h-[560px] w-[760px] opacity-45"
          style={{
            background:
              "radial-gradient(55% 55% at 60% 55%, var(--primary-500) 0%, transparent 70%)",
          }}
        />
      </div>

      <Container className="relative flex flex-col gap-10 md:gap-12">
        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Confidentialité opérationnelle par défaut.
          </h2>
          <p className="text-base text-white/75 md:text-lg">
            Un événement professionnel mélange participants, prestataires et décisions internes.
            Nalka garde ces niveaux séparés.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="group h-full rounded-2xl border border-white/10 bg-white/5! text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:border-white/20 hover:bg-white/10! hover:shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
              >
                <CardHeader className="space-y-4">
                  <div className="space-y-3 text-left">
                    <span
                      className={[
                        "relative flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg",
                        "bg-linear-to-br from-(--primary-600) to-(--primary-500)",
                        "transition-all duration-200",
                        "group-hover:shadow-[0_14px_22px_-16px_rgba(127,34,254,0.55)]",
                      ].join(" ")}
                    >
                      <Icon className="h-[15px] w-[15px]" aria-hidden />
                    </span>

                    <div className="space-y-2">
                      <CardTitle className="text-lg font-semibold text-white">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-white/75">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm text-white/90">
          <span className="font-semibold text-white">Les informations sensibles restent cadrées.</span>{" "}
          Les modules publics et les modules organisateur ne racontent pas la même chose aux mêmes
          personnes.
        </div>
      </Container>
    </section>
  );
}
