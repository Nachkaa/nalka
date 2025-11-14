import { Hero } from "@/components/home/Hero";
import { Manifest } from "@/components/home/Manifest";
import { UseCases } from "@/components/home/UseCases";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CtaFinal } from "@/components/home/CtaFinal";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-cream text-forest antialiased">
      <Hero />
      <Manifest />
      <UseCases />
      <HowItWorks />
      <CtaFinal />
    </main>
  );
}
