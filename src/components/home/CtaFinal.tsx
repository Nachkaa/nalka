import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaFinal() {
  return (
    <section className="bg-primary text-primary-foreground py-32 text-center px-6">
      {/* légère texture de fond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]
                   bg-[radial-gradient(circle_at_top_left,#F9F5E7,transparent_55%),radial-gradient(circle_at_bottom_right,#F9F5E7,transparent_55%)]"
      />

      <div className="relative mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-cream/70">
          Prêt quand vous l’êtes
        </p>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6">
          Lancez votre événement maintenant.
        </h2>

        <p className="max-w-2xl mx-auto text-primary-foreground/90 text-base md:text-lg leading-relaxed">
          Lancez votre événement en moins de deux minutes. Invitez, récoltez les idées
          et les cadeaux, puis profitez du jour J sans vous perdre dans la gestion.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full bg-cream px-8 text-base font-medium text-forest hover:bg-cream/90 shadow-md"
          >
            <Link href="/event/new">Créer mon événement</Link>
          </Button>
        </div>  
      </div>
    </section>
  );
}
