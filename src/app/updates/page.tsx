import type { Metadata } from "next";

import { UpdatesPageClient } from "@/app/updates/_components/UpdatesPageClient";
import { releaseNotes } from "@/content/release-notes";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicMetadata({
  title: "Notes de version",
  description:
    "Suivez les dernières améliorations Nalka : création d'événement, Programme, cadeaux, Secret Santa et qualité produit.",
  path: "/updates",
});

export default function UpdatesPage() {
  return <UpdatesPageClient notes={releaseNotes} />;
}
