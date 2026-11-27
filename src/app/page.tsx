import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarketingExamplesSection } from "@/app/(app)/_components/MarketingExamplesSection";
import { MarketingHowItWorksSection } from "@/app/(app)/_components/MarketingHowItWorksSection";
import { MarketingModulesSection } from "@/app/(app)/_components/MarketingModulesSection";
import { MarketingPreviewSection } from "@/app/(app)/_components/MarketingPreviewSection";
import { MarketingPrivacySection } from "@/app/(app)/_components/MarketingPrivacySection";
import { auth } from "@/auth";
import { Hero } from "@/components/home/Hero";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { StructuredData } from "@/components/seo/StructuredData";
import { isChristmasSeason } from "@/features/events/christmas-season";
import { absoluteUrl, buildPublicMetadata } from "@/lib/seo";

const homeTitle = "Cadeaux, Secret Santa et moments à partager";
const homeDescription =
  "Organisez un Secret Santa entre collègues, Noël entre amis ou une fête en famille : listes de cadeaux, tirage privé et préparatifs partagés avec Nalka.";

export const metadata: Metadata = buildPublicMetadata({
  title: homeTitle,
  description: homeDescription,
  path: "/",
});

export default async function MarketingHomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/event");
  }

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: homeTitle,
          url: absoluteUrl("/"),
          description: homeDescription,
        }}
      />
      <MarketingNavbar />
      <Hero christmasSeason={isChristmasSeason(new Date())} />
      <MarketingModulesSection />
      <MarketingPreviewSection />
      <MarketingHowItWorksSection />
      <MarketingPrivacySection />
      <MarketingExamplesSection />
    </>
  );
}
