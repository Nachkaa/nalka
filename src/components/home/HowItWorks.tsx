"use client";

import { Calendar, Link2, ListChecks, PartyPopper } from "lucide-react";

const steps = [
  {
    icon: Calendar,
    title: "Créer votre événement",
    text: "Choisissez votre événement et vos options : idées, règles, budget, secret santa…",
  },
  {
    icon: Link2,
    title: "Inviter en un clic",
    text: "Envoyez un simple lien : tout le monde rejoint immédiatement.",
  },
  {
    icon: ListChecks,
    title: "Contribuer ensemble",
    text: "Idées, réservations, présences : tout se synchronise, sans spoil.",
  },
  {
    icon: PartyPopper,
    title: "Profiter le jour J",
    text: "Tout est clair et prêt. Vous vous concentrez sur les gens, pas sur la gestion.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-cream px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center font-serif text-3xl md:text-4xl">Comment ça marche ?</h2>

        {/* WRAPPER RELATIVE POUR LA LIGNE + LES STEPS */}
        <div className="relative mt-14">
          {/* Ligne verticale */}
          <div className="pointer-events-none absolute top-[36px] bottom-[36px] left-[24px] w-px bg-black/10" />

          <ul className="space-y-14">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex items-center gap-6">
                  {/* Cercle + icône (au-dessus de la ligne) */}
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                    <Icon className="text-forest h-5 w-5" />
                  </div>

                  {/* Texte */}
                  <div>
                    <h3 className="font-serif text-lg md:text-xl">{step.title}</h3>
                    <p className="text-forest/80 mt-1 text-sm md:text-base">{step.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
