import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { StructuredData } from "@/components/seo/StructuredData";
import { isChristmasSeason } from "@/features/events/christmas-season";
import { Homepage } from "@/features/marketing/homepage/Homepage";
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
      <Homepage christmasSeason={isChristmasSeason(new Date())} />
    </>
  );
}
