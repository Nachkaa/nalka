import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = {
  title: "Conditions Générales d’Utilisation",
  description:
    "Conditions d’utilisation du service Nalka : accès, contenus, responsabilités, données personnelles, suspension et droit applicable.",
  robots: { index: true, follow: true },
};

const UPDATED_AT = "2025-11-10";

export default function Page() {
  return (
    <>
      <PageHeader title="Conditions Générales d’Utilisation" />
      <main
        className={[
          "prose prose-neutral mx-auto px-6 py-12",
          "max-w-2xl md:max-w-3xl",
          // typographie + respirations (Tailwind Typography modifiers)
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

        <h2 id="objet">1. Objet</h2>
        <p>
          Nalka permet de créer des événements et des listes de souhaits afin de
          partager des cadeaux entre proches. Toute utilisation doit rester
          conforme aux présentes conditions et à la loi.
        </p>

        <h2 id="compte">2. Compte</h2>
        <p>
          Un compte nécessite une adresse e-mail valide. Vous êtes responsable
          de la sécurité et de l’usage de votre compte.
        </p>

        <h2 id="contenus">3. Contenus</h2>
        <p>
          Vous restez propriétaire de vos contenus. Vous accordez à Nalka une
          licence limitée et non exclusive pour les héberger, afficher et
          sauvegarder.
        </p>

        <h2 id="responsabilite">4. Responsabilité</h2>
        <p>
          Le service est fourni « en l’état ». Nalka ne garantit pas l’absence
          d’erreurs ou d’interruptions. La responsabilité totale est limitée au
          montant éventuellement payé sur les 12 derniers mois.
        </p>

        <h2 id="suspension">5. Suspension / Suppression</h2>
        <p>
          Nalka peut suspendre ou supprimer un compte en cas de violation des
          règles, de fraude ou de menace pour la sécurité. Vous pouvez à tout
          moment supprimer votre compte.
        </p>

        <h2 id="donnees">6. Données personnelles</h2>
        <p>
          Le traitement des données est décrit dans la{" "}
          <a href="/privacy">Politique de confidentialité</a>. Elle fait partie
          intégrante des présentes CGU.
        </p>

        <h2 id="modif">7. Modifications</h2>
        <p>
          Nalka peut modifier les CGU à tout moment. Les changements importants
          seront notifiés raisonnablement. L’usage continu vaut acceptation.
        </p>

        <h2 id="droit">8. Droit applicable</h2>
        <p>
          Droit français. Compétence exclusive des tribunaux de Paris, sous
          réserve de dispositions impératives plus favorables au consommateur.
        </p>

        <h2 id="contact">9. Contact</h2>
        <p>
          Support et signalement d’abus&nbsp;:{" "}
          <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>
        </p>
      </main>
    </>
  );
}
