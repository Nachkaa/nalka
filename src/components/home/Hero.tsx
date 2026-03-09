"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";

export function Hero() {
  const reduce = useReducedMotion();

  const badges = ["Gratuit", "1 minute"];

  return (
    <section
      aria-labelledby="homepage-hero-title"
      className="relative isolate w-full overflow-hidden"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src="/images/hero-dinner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Scrim simple, chaud, centré sur la zone texte à gauche */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(9,24,18,0.78)_0%,rgba(9,24,18,0.55)_30%,rgba(9,24,18,0.25)_55%,rgba(9,24,18,0)_100%)]" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid min-h-[72vh] items-end pt-24 pb-20 lg:grid-cols-12 lg:items-center lg:pt-32">
            <div className="text-white lg:col-span-7">
              <motion.h1
                id="homepage-hero-title"
                className="mt-5 font-serif text-[clamp(2.6rem,6.2vw,4.8rem)] leading-[1.03] tracking-[-0.02em] drop-shadow-sm"
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                Votre événement commence ici.
              </motion.h1>

              <motion.p
                className="mt-4 max-w-xl text-[clamp(1rem,2vw,1.25rem)] text-white/92"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
              >
                Organisez, partagez, célébrez sans contrainte.
                <br />
                Nalka simplifie tout.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-wrap items-center gap-3"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/50 bg-white/10 px-8 py-6 text-white backdrop-blur-xl transition-all duration-300 hover:border-white/60 hover:bg-white/20"
                >
                  <Link href="/event/new">Créer mon événement</Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/50 bg-white/10 px-8 py-6 text-white backdrop-blur-xl transition-all duration-300 hover:border-white/60 hover:bg-white/20"
                >
                  <Link href="#how">Voir comment ça marche</Link>
                </Button>
              </motion.div>

              <div aria-hidden="true" className="mt-6 inline-flex flex-wrap items-center gap-2">
                {badges.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white/18 px-3 py-1.5 text-sm text-white/95 shadow-sm backdrop-blur-md"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-14 lg:col-span-5 lg:mt-0" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[var(--cream)]" />
    </section>
  );
}
