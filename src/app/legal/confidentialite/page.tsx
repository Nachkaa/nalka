import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { StructuredData } from "@/components/seo/StructuredData";
import { absoluteUrl, buildPublicMetadata } from "@/lib/seo";

export const metadata = buildPublicMetadata({
  title: "Politique de confidentialite",
  description:
    "Consultez la politique de confidentialite de Nalka pour le traitement des donnees, les droits des utilisateurs et les garanties appliquees.",
  path: "/legal/confidentialite",
});

const UPDATED_AT = "2025-11-10";

export default function Page() {
  const breadcrumbs = [
    { name: "Accueil", href: "/" },
    { name: "Politique de confidentialite" },
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
            item: item.href ? absoluteUrl(item.href) : absoluteUrl("/legal/confidentialite"),
          })),
        }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <PageHeader title="Politique de confidentialite" />
      <main
        className={[
          "prose prose-neutral mx-auto",
          "max-w-2xl px-6 py-12 md:max-w-3xl",
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

        <h2>1. Responsable du traitement</h2>
        <p>
          Aurele Soyez - <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>
        </p>

        <h2>2. Delegue a la protection des donnees</h2>
        <p>
          Aucun delegue designe. Contact unique&nbsp;:{" "}
          <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>
        </p>

        <h2>3. Donnees traitees</h2>
        <ul>
          <li>
            <strong>Compte&nbsp;:</strong> adresse e-mail, journaux d'authentification.
          </li>
          <li>
            <strong>Application&nbsp;:</strong> evenements, listes de souhaits, reservations,
            membres associes.
          </li>
          <li>
            <strong>Technique&nbsp;:</strong> adresse IP, user-agent, journaux serveur, preferences
            de consentement.
          </li>
        </ul>

        <h2>4. Finalites et bases legales</h2>
        <ul>
          <li>
            <strong>Fourniture du service</strong> - execution du contrat.
          </li>
          <li>
            <strong>Securite et prevention de l'abus</strong> - interet legitime.
          </li>
          <li>
            <strong>Mesure d'audience</strong> - consentement.
          </li>
        </ul>

        <h2>5. Destinataires et sous-traitants</h2>
        <p>
          Donnees accessibles uniquement aux prestataires techniques necessaires&nbsp;: hebergement,
          e-mail, mesure d'audience. Tous sont lies par des accords de sous-traitance conformes au
          RGPD.
        </p>

        <h2>6. Transferts hors de l'Union europeenne</h2>
        <p>
          En cas de transfert, des garanties appropriees sont appliquees, telles que les Clauses
          Contractuelles Types approuvees par la Commission europeenne.
        </p>

        <h2>7. Durees de conservation</h2>
        <ul>
          <li>Compte&nbsp;: jusqu'a suppression volontaire.</li>
          <li>Journaux de securite&nbsp;: jusqu'a 12&nbsp;mois.</li>
          <li>Preferences cookies&nbsp;: 6&nbsp;mois.</li>
          <li>Copies de sauvegarde&nbsp;: selon la politique d'exploitation.</li>
        </ul>

        <h2>8. Vos droits</h2>
        <p>
          Vous disposez des droits d'acces, rectification, effacement, limitation, opposition,
          portabilite, retrait du consentement et definition de directives post-mortem.
        </p>
        <p>
          Pour les exercer, contactez&nbsp;: <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>.
          Vous pouvez egalement saisir la CNIL&nbsp;:{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            www.cnil.fr
          </a>
          .
        </p>

        <h2>9. Decisions automatisees</h2>
        <p>
          Nalka ne prend aucune decision exclusivement automatisee produisant des effets juridiques
          ou significatifs sur les utilisateurs.
        </p>
      </main>
    </>
  );
}
