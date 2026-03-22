import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { StructuredData } from "@/components/seo/StructuredData";
import { absoluteUrl, buildPublicMetadata } from "@/lib/seo";

export const metadata = buildPublicMetadata({
  title: "Politique cookies",
  description:
    "Consultez la politique cookies de Nalka pour comprendre les cookies necessaires, la mesure d'audience et la gestion du consentement.",
  path: "/legal/cookies",
});

const UPDATED_AT = "2025-11-10";

export default function Page() {
  const breadcrumbs = [{ name: "Accueil", href: "/" }, { name: "Politique cookies" }];

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
            item: item.href ? absoluteUrl(item.href) : absoluteUrl("/legal/cookies"),
          })),
        }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <PageHeader title="Cookies" />
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

        <h2>1. Cookies strictement necessaires</h2>
        <p>
          Ces cookies sont indispensables au fonctionnement du site&nbsp;: gestion de session,
          securite, et enregistrement de votre preference de consentement. Ils ne necessitent pas
          d&apos;accord prealable.
        </p>

        <h2>2. Mesure d&apos;audience</h2>
        <p>
          Des cookies peuvent etre utilises pour mesurer la frequentation et ameliorer l&apos;experience
          utilisateur. Ils ne sont deposes qu&apos;apres votre accord explicite via le bandeau de
          consentement. Vous pouvez refuser aussi facilement qu&apos;accepter, et retirer votre choix a
          tout moment.
        </p>

        <h2>3. Duree de validite du choix</h2>
        <p>
          Votre preference (acceptation ou refus) est conservee pendant 6&nbsp;mois, puis redemandee
          a expiration de ce delai.
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
    window.dispatchEvent(new CustomEvent("nalka:consent", { detail: { consent: value } }));
    alert(`Consentement defini sur "${value}". Rechargez la page pour appliquer.`);
  };

  return (
    <div className="not-prose mt-4 flex gap-4">
      <button className="hover:text-foreground/80 underline" onClick={() => setConsent("granted")}>
        Accepter
      </button>
      <button className="hover:text-foreground/80 underline" onClick={() => setConsent("denied")}>
        Refuser
      </button>
    </div>
  );
}
