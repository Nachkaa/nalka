import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site Nalka : informations sur l’éditeur, l’hébergeur et le responsable de publication.",
  robots: { index: true, follow: true },
};

const UPDATED_AT = "2025-11-10";

export default function Page() {
  return (
    <>
      <PageHeader title="Mentions légales" />
      <main
        className={[
          "prose prose-neutral mx-auto",
          "px-6 py-12 max-w-2xl md:max-w-3xl",
          "prose-lg md:prose-xl",
          "prose-headings:mt-10 prose-headings:mb-3",
          "prose-p:my-5 prose-p:leading-7 md:prose-p:leading-8",
          "prose-ul:my-6 prose-ol:my-6",
          "prose-li:my-2 prose-li:leading-7",
        ].join(" ")}
      >
        <p className="text-sm text-muted-foreground not-prose">
          Dernière mise à jour&nbsp;: {UPDATED_AT}
        </p>

        <h2>1. Éditeur</h2>
        <p>
          <strong>Nom&nbsp;:</strong> Aurèle Soyez
          <br />
          <strong>Adresse&nbsp;:</strong> 1 rue Galléan 06000 Nice
          <br />
          <strong>Contact&nbsp;:</strong>{" "}
          <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>
          <br />
          <strong>Statut&nbsp;:</strong> Éditeur personne physique (activité non
          immatriculée)
          <br />
          <strong>TVA&nbsp;:</strong> non applicable (article&nbsp;293&nbsp;B du&nbsp;CGI)
        </p>

        <h2>2. Directeur de la publication</h2>
        <p>Aurèle Soyez</p>

        <h2>3. Hébergeur</h2>
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
          Téléphone&nbsp;: +49&nbsp;721&nbsp;960&nbsp;0
        </p>

        <h2>4. Propriété intellectuelle</h2>
        <p>
          L’ensemble du contenu du site (textes, images, code, graphismes,
          logos) est protégé par le droit de la propriété intellectuelle. Toute
          reproduction totale ou partielle sans autorisation préalable est
          interdite.
        </p>

        <h2>5. Responsabilité</h2>
        <p>
          Nalka ne peut être tenue responsable des erreurs, omissions ou
          dysfonctionnements temporaires du service. Les liens externes ne
          relèvent pas de sa responsabilité.
        </p>

        <h2>6. Signalement de contenu illicite</h2>
        <p>
          Pour toute demande de retrait ou signalement d’un contenu illicite,
          contactez&nbsp;:{" "}
          <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>.
        </p>
      </main>
    </>
  );
}
