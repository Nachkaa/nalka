"use client";

import Image from "next/image";
import step1 from "@public/illustrations/step-1.webp";
import step2 from "@public/illustrations/step-2.webp";
import step3 from "@public/illustrations/step-3.webp";
import step4 from "@public/illustrations/step-4.webp";


const steps = [
  {
    title: "Crée l’événement et invite",
    desc: "Nom, date, règles. Ajoute tes proches.",
    icon: <path d="M6 7h12M6 12h12M6 17h8" strokeWidth="1.6" strokeLinecap="round" />,
    img: { src: step1, alt: "Création d’un événement et invitations" },
  },
  {
    title: "Crée ta liste",
    desc: "Idées, liens, budget.",
    icon: <path d="M12 12a4 4 0 1 0-4-4m8 8c0-2.2-3-3.5-4-3.5s-4 1.3-4 3.5" strokeWidth="1.6" strokeLinecap="round" />,
    img: { src: step2, alt: "Ajout d’idées cadeaux à sa liste" },
  },
  {
    title: "Réserve en silence",
    desc: "Tu vois ce qu’il reste, jamais qui a pris.",
    icon: <path d="M4 12h16M8 12v6m8-6v6" strokeWidth="1.6" strokeLinecap="round" />,
    img: { src: step3, alt: "Réservation d’un cadeau sans spoiler" },
  },
  {
    title: "Célébrez ensemble",
    desc: "Le jour J, la promesse devient cadeau.",
    icon: (
      <>
        <path d="M12 3l1.2 2.6 2.8.2-2.1 1.8.7 2.7L12 8.8 9.4 10.3l.7-2.7L8 5.8l2.8-.2L12 3z" strokeWidth="1.6" />
        <path d="M6 14h12v6H6z" strokeWidth="1.6" />
      </>
    ),
    img: { src: step4, alt: "Ouverture des cadeaux en famille" },
  },
] as const;

export default function StorySteps() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s) => (
        <li
          key={s.title}
          className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-black/10 transition-all hover:-translate-y-0.5"
        >
         <div className="p-4 min-h-[7.5rem]">
            <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)] ring-1 ring-black/10">
                 <svg
                   viewBox="0 0 24 24"
                   width="20"
                   height="20"
                   fill="none"
                   stroke="var(--accent-foreground)"
                   aria-hidden="true"
                 >
                   {s.icon}
                 </svg>
               </div>
               <h3 className="text-sm font-medium">{s.title}</h3>
            </div>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{s.desc}</p>
          </div>

          {/* full-bleed */}
          <figure className="mt-auto">
            <div className="relative aspect-[4/3] -mx-4 -mb-4">
              <Image
                src={s.img.src}
                alt={s.img.alt}
                fill
                sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 90vw"
                className="object-cover"
                priority={false}
              />
            </div>
          </figure>
        </li>
      ))}
    </ol>
  );
}
