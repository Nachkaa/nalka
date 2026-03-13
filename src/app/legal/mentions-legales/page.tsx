import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { StructuredData } from "@/components/seo/StructuredData";
import { absoluteUrl, buildPublicMetadata } from "@/lib/seo";

export const metadata = buildPublicMetadata({
  title: "Mentions legales",
  description:
    "Consultez les mentions legales de Nalka avec les informations sur l'editeur, l'hebergeur et le responsable de publication.",
  path: "/legal/mentions-legales",
});

const UPDATED_AT = "2025-11-10";

export default function Page() {
  const breadcrumbs = [{ name: "Accueil", href: "/" }, { name: "Mentions legales" }];

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
            item: item.href ? absoluteUrl(item.href) : absoluteUrl("/legal/mentions-legales"),
          })),
        }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <PageHeader title="Mentions legales" />
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

        <h2>1. Editeur</h2>
        <p>
          <strong>Nom&nbsp;:</strong> Aurele Soyez
          <br />
          <strong>Adresse&nbsp;:</strong> 1 rue Gallean 06000 Nice
          <br />
          <strong>Contact&nbsp;:</strong> <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>
          <br />
          <strong>Statut&nbsp;:</strong> Editeur personne physique (activite non immatriculee)
          <br />
          <strong>TVA&nbsp;:</strong> non applicable (article&nbsp;293&nbsp;B du&nbsp;CGI)
        </p>

        <h2>2. Directeur de la publication</h2>
        <p>Aurele Soyez</p>

        <h2>3. Hebergeur</h2>
        <p>
          <strong>IONOS SE</strong>
          <br />
          Elgendorfer&nbsp;Str.&nbsp;57
          <br />
          56410&nbsp;Montabaur, Allemagne
          <br />
          <a href="https://www.ionos.fr" target="_blank" rel="noopener noreferrer">
            www.ionos.fr
          </a>
          <br />
          Telephone&nbsp;: +49&nbsp;721&nbsp;960&nbsp;0
        </p>

        <h2>4. Propriete intellectuelle</h2>
        <p>
          L'ensemble du contenu du site (textes, images, code, graphismes, logos) est protege par le
          droit de la propriete intellectuelle. Toute reproduction totale ou partielle sans
          autorisation prealable est interdite.
        </p>

        <h2>5. Responsabilite</h2>
        <p>
          Nalka ne peut etre tenue responsable des erreurs, omissions ou dysfonctionnements
          temporaires du service. Les liens externes ne relevent pas de sa responsabilite.
        </p>

        <h2>6. Signalement de contenu illicite</h2>
        <p>
          Pour toute demande de retrait ou signalement d'un contenu illicite, contactez&nbsp;:{" "}
          <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>.
        </p>
      </main>
    </>
  );
}
