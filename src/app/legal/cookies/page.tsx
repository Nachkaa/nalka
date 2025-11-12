import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = {
  title: "Cookies",
  description:
    "Informations sur l’utilisation des cookies sur Nalka : cookies nécessaires, mesure d’audience et gestion du consentement.",
  robots: { index: true, follow: true },
};

const UPDATED_AT = "2025-11-10";

export default function Page() {
  return (
    <>
      <PageHeader title="Cookies" />
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

        <h2>1. Cookies strictement nécessaires</h2>
        <p>
          Ces cookies sont indispensables au fonctionnement du site&nbsp;:
          gestion de session, sécurité, et enregistrement de votre préférence de
          consentement. Ils ne nécessitent pas d’accord préalable.
        </p>

        <h2>2. Mesure d’audience</h2>
        <p>
          Des cookies peuvent être utilisés pour mesurer la fréquentation et
          améliorer l’expérience utilisateur. Ils ne sont déposés qu’après votre
          accord explicite via le bandeau de consentement. Vous pouvez refuser
          aussi facilement qu’accepter, et retirer votre choix à tout moment.
        </p>

        <h2>3. Durée de validité du choix</h2>
        <p>
          Votre préférence (acceptation ou refus) est conservée pendant
          6&nbsp;mois, puis redemandée à expiration de ce délai.
        </p>

        <h2>4. Modifier votre choix</h2>
        <ConsentManager />
      </main>
    </>
  );
}

function ConsentManager() {
  if (typeof window === "undefined") return null;

  const setConsent = (value: "granted" | "denied") => {
    localStorage.setItem("cookie.consent", value);
    window.dispatchEvent(
      new CustomEvent("nalka:consent", { detail: { consent: value } })
    );
    alert(`Consentement défini sur « ${value} ». Rechargez la page pour appliquer.`);
  };

  return (
    <div className="not-prose flex gap-4 mt-4">
      <button
        className="underline hover:text-foreground/80"
        onClick={() => setConsent("granted")}
      >
        Accepter
      </button>
      <button
        className="underline hover:text-foreground/80"
        onClick={() => setConsent("denied")}
      >
        Refuser
      </button>
    </div>
  );
}
