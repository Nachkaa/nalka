import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { StructuredData } from "@/components/seo/StructuredData";
import { absoluteUrl, buildPublicMetadata } from "@/lib/seo";

export const metadata = buildPublicMetadata({
  title: "Conditions generales d'utilisation",
  description:
    "Consultez les conditions generales d'utilisation de Nalka pour l'acces au service, les responsabilites et les regles applicables.",
  path: "/legal/cgu",
});

const UPDATED_AT = "2025-11-10";

export default function Page() {
  const breadcrumbs = [
    { name: "Accueil", href: "/" },
    { name: "Conditions generales d'utilisation" },
  ];

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.href ? absoluteUrl(item.href) : absoluteUrl("/legal/cgu"),
          })),
        }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <PageHeader title="Conditions Generales d'Utilisation" />
      <main
        className={[
          "prose prose-neutral mx-auto px-6 py-12",
          "max-w-2xl md:max-w-3xl",
          "prose-lg md:prose-xl",
          "prose-headings:mt-10 prose-headings:mb-3",
          "prose-p:my-5 prose-p:leading-7 md:prose-p:leading-8",
          "prose-ul:my-6 prose-ol:my-6",
          "prose-li:my-2 prose-li:leading-7",
        ].join(" ")}
      >
        <p className="text-muted-foreground not-prose text-sm">
          Derniere mise a jour&nbsp;: {UPDATED_AT}
        </p>

        <h2 id="objet">1. Objet</h2>
        <p>
          Nalka permet de creer des evenements et des listes de souhaits afin de partager des
          cadeaux entre proches. Toute utilisation doit rester conforme aux presentes conditions et
          a la loi.
        </p>

        <h2 id="compte">2. Compte</h2>
        <p>
          Un compte necessite une adresse e-mail valide. Vous etes responsable de la securite et de
          l&apos;usage de votre compte.
        </p>

        <h2 id="contenus">3. Contenus</h2>
        <p>
          Vous restez proprietaire de vos contenus. Vous accordez a Nalka une licence limitee et non
          exclusive pour les heberger, afficher et sauvegarder.
        </p>

        <h2 id="responsabilite">4. Responsabilite</h2>
        <p>
          Le service est fourni &quot;en l&apos;etat&quot;. Nalka ne garantit pas l&apos;absence
          d&apos;erreurs ou d&apos;interruptions. La responsabilite totale est limitee au montant
          eventuellement paye sur
          les 12 derniers mois.
        </p>

        <h2 id="suspension">5. Suspension / Suppression</h2>
        <p>
          Nalka peut suspendre ou supprimer un compte en cas de violation des regles, de fraude ou
          de menace pour la securite. Vous pouvez a tout moment supprimer votre compte.
        </p>

        <h2 id="donnees">6. Donnees personnelles</h2>
        <p>
          Le traitement des donnees est decrit dans la{" "}
          <a href="/legal/confidentialite">Politique de confidentialite</a>. Elle fait partie
          integrante des presentes CGU.
        </p>

        <h2 id="modif">7. Modifications</h2>
        <p>
          Nalka peut modifier les CGU a tout moment. Les changements importants seront notifies
          raisonnablement. L&apos;usage continu vaut acceptation.
        </p>

        <h2 id="droit">8. Droit applicable</h2>
        <p>
          Droit francais. Competence exclusive des tribunaux de Paris, sous reserve de dispositions
          imperatives plus favorables au consommateur.
        </p>

        <h2 id="contact">9. Contact</h2>
        <p>
          Support et signalement d&apos;abus&nbsp;:{" "}
          <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>
        </p>
      </main>
    </>
  );
}
