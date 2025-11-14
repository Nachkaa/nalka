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
      className="relative isolate h-[100vh] w-full overflow-hidden"
    >
      {/* PHOTO — replace with a real, warm dinner/toast photo (golden hour, faces slightly off-camera) */}
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src="/images/hero-dinner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
         />
        {/* WARM SCRIMS (keep highlights) */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,28,21,0.20)_0%,rgba(14,28,21,0.35)_35%,rgba(14,28,21,0.55)_100%)]" />
        {/* VIGNETTE for depth */}
        <div className="absolute inset-0 [mask-image:radial-gradient(120%_90%_at_50%_30%,#000_45%,transparent)]" />
      </div>

      {/* CONTENT GRID */}
      <div className="relative z-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-12 min-h-[72vh] items-end lg:items-center pt-24 pb-20 lg:pt-32">
            {/* LEFT: COPY */}
            <div className="lg:col-span-7 text-white">

              <motion.h1
                id="homepage-hero-title"
                className="mt-5 font-serif leading-[1.03] text-[clamp(2.6rem,6.2vw,4.8rem)] tracking-[-0.02em] drop-shadow-sm"
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
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
                <br />Nalka simplifie tout.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-wrap items-center gap-3"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                {/* PRIMARY CTA — more presence */}
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="
                    rounded-full 
                    border-white/50 
                    text-white 
                    backdrop-blur-xl
                    px-8 py-6
                    bg-white/10
                    hover:bg-white/20 hover:border-white/60
                    transition-all duration-300
                  "
                >
                  <Link href="/event/new">Créer mon événement</Link>
                </Button>

                {/* SECONDARY CTA — subtle glass, higher contrast */}
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="
                    rounded-full 
                    border-white/50 
                    text-white 
                    backdrop-blur-xl
                    px-8 py-6
                    bg-white/10
                    hover:bg-white/20 hover:border-white/60
                    transition-all duration-300
                  "
                >
                  <Link href="#how">Voir comment ça marche</Link>
                </Button>
              </motion.div>

              {/* TRUST HINTS — lighter, no heavy borders */}
              <div
                aria-hidden="true"
                className="mt-6 inline-flex flex-wrap items-center gap-2"
              >
                {badges.map((t) => (
                  <span
                    key={t}
                    className="
                      rounded-full 
                      bg-white/18 
                      px-3 py-1.5 
                      text-sm 
                      text-white/95 
                      backdrop-blur-md
                      shadow-sm
                    "
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT: empty to keep photo breathing room */}
            <div className="mt-14 lg:mt-0 lg:col-span-5" />
          </div>
        </div>
      </div>

      {/* FADE TO PAGE BG */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[var(--cream)]" />
    </section>
  );
}
