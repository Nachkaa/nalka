import { EyeOff, Gift, LockKeyhole } from "lucide-react";

import { Container } from "@/components/layout/Container";

const protections = [
  {
    icon: Gift,
    title: "Des cadeaux qui gardent leur surprise",
    description: "La personne qui reçoit un cadeau ne voit pas les réservations de sa liste.",
  },
  {
    icon: EyeOff,
    title: "Des réservations anonymes",
    description: "Le nom de la personne qui réserve un cadeau n’est pas affiché.",
  },
  {
    icon: LockKeyhole,
    title: "Un Secret Santa vraiment privé",
    description: "Chaque personne découvre uniquement sa propre attribution.",
  },
] as const;

export function MarketingPrivacySection() {
  return (
    <section id="confidentialite-privee" className="bg-[#172b26] py-16 text-white md:py-20">
      <Container className="space-y-10 px-5 md:px-6">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold tracking-[0.15em] text-white/65 uppercase">
            Les petits secrets sont bien gardés
          </p>
          <h2 className="font-serif text-3xl leading-tight text-balance md:text-[2.6rem]">
            Le plaisir d’organiser. La surprise en plus.
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3 md:gap-12">
          {protections.map(({ icon: Icon, title, description }) => (
            <div key={title} className="space-y-4 border-t border-white/20 pt-6">
              <Icon className="size-5 text-white/80" strokeWidth={1.5} aria-hidden />
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-white/75">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
