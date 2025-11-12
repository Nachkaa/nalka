import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité du service Nalka : gestion des données personnelles, droits des utilisateurs et sécurité.",
  robots: { index: true, follow: true },
};

const UPDATED_AT = "2025-11-10";

export default function Page() {
  return (
    <>
      <PageHeader title="Politique de confidentialité" />
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

        <h2>1. Responsable du traitement</h2>
        <p>
          Aurèle Soyez —{" "}
          <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>
        </p>

        <h2>2. Délégué à la protection des données</h2>
        <p>
          Aucun délégué désigné. Contact unique&nbsp;:{" "}
          <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>
        </p>

        <h2>3. Données traitées</h2>
        <ul>
          <li>
            <strong>Compte&nbsp;:</strong> adresse e-mail, journaux
            d’authentification.
          </li>
          <li>
            <strong>Application&nbsp;:</strong> événements, listes de souhaits,
            réservations, membres associés.
          </li>
          <li>
            <strong>Technique&nbsp;:</strong> adresse IP, user-agent, journaux
            serveur, préférences de consentement.
          </li>
        </ul>

        <h2>4. Finalités et bases légales</h2>
        <ul>
          <li>
            <strong>Fourniture du service</strong> — exécution du contrat.
          </li>
          <li>
            <strong>Sécurité et prévention de l’abus</strong> — intérêt légitime.
          </li>
          <li>
            <strong>Mesure d’audience</strong> — consentement.
          </li>
        </ul>

        <h2>5. Destinataires et sous-traitants</h2>
        <p>
          Données accessibles uniquement aux prestataires techniques
          nécessaires&nbsp;: hébergement, e-mail, mesure d’audience. Tous sont
          liés par des accords de sous-traitance (DPA) conformes au RGPD.
        </p>

        <h2>6. Transferts hors de l’Union européenne</h2>
        <p>
          En cas de transfert, des garanties appropriées sont appliquées, telles
          que les Clauses Contractuelles Types (SCC) approuvées par la
          Commission européenne.
        </p>

        <h2>7. Durées de conservation</h2>
        <ul>
          <li>Compte&nbsp;: jusqu’à suppression volontaire.</li>
          <li>Journaux de sécurité&nbsp;: jusqu’à 12&nbsp;mois.</li>
          <li>Préférences cookies&nbsp;: 6&nbsp;mois.</li>
          <li>Copies de sauvegarde&nbsp;: selon la politique d’exploitation.</li>
        </ul>

        <h2>8. Vos droits</h2>
        <p>
          Vous disposez des droits d’accès, rectification, effacement,
          limitation, opposition, portabilité, retrait du consentement et
          définition de directives post-mortem.
        </p>
        <p>
          Pour les exercer, contactez&nbsp;:{" "}
          <a href="mailto:contact@nalka.fr">contact@nalka.fr</a>. Vous pouvez
          également saisir la CNIL&nbsp;:{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            www.cnil.fr
          </a>.
        </p>

        <h2>9. Décisions automatisées</h2>
        <p>
          Nalka ne prend aucune décision exclusivement automatisée produisant des
          effets juridiques ou significatifs sur les utilisateurs.
        </p>
      </main>
    </>
  );
}
