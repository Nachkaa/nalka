import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";

import { HomepageMotion } from "./HomepageMotion";
import { HomepageNavigation } from "./HomepageNavigation";
import { CompactEventPreview, EventPreview, StepPreview } from "./HomepagePreviews";
import styles from "./homepage.module.css";

const sans = localFont({
  src: "../../../assets/fonts/hanken-grotesk/HankenGrotesk-Variable.ttf",
  weight: "100 900",
  variable: "--font-home-sans",
  display: "swap",
});
const serif = localFont({
  src: [
    {
      path: "../../../assets/fonts/instrument-serif/InstrumentSerif-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../assets/fonts/instrument-serif/InstrumentSerif-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-home-serif",
  display: "swap",
});

// Existing local assets are kept together for the later photography update.
const images = {
  christmas: "/images/christmas-gift-exchange.webp",
  detail: "/images/usecases/christmas.webp",
  dinner: "/images/hero-dinner.webp",
  birthday: "/images/usecases/birthday.webp",
} as const;

const steps = [
  {
    title: "Réunissez votre groupe.",
    text: "Nommez votre Secret Santa et partagez le lien d’invitation. Amis, collègues ou cousins rejoignent le groupe.",
  },
  {
    title: "Lancez le tirage.",
    text: "Quand tout le monde a rejoint le groupe, lancez le tirage. Chaque personne découvre son résultat en privé.",
  },
  {
    title: "Préparez votre surprise.",
    text: "Consultez sa liste d’envies si elle en a partagé une, et réservez une idée.",
  },
] as const;

const privacy = [
  {
    title: "Un tirage vraiment privé",
    text: "Chacun consulte uniquement sa propre attribution, y compris la personne qui organise.",
  },
  {
    title: "Des réservations anonymes",
    text: "La personne qui reçoit ne voit pas les réservations de sa liste. L’identité des autres personnes qui réservent reste cachée.",
  },
  {
    title: "Des listes facultatives",
    text: "Chacun choisit de partager, ou non, quelques idées avec le groupe.",
  },
] as const;

export function Homepage({ christmasSeason }: { christmasSeason: boolean }) {
  const href = christmasSeason ? "/event/new?occasion=christmas" : "/event/new";
  const label = christmasSeason ? "Préparer mon Secret Santa" : "Créer mon événement";

  return (
    <HomepageMotion className={`${sans.variable} ${serif.variable}`}>
      <a className={styles.skipLink} href="#home-content">
        Aller au contenu
      </a>
      <HomepageNavigation href={href} label={label} />
      <div id="home-content" tabIndex={-1}>
        <section aria-labelledby="home-title" className={styles.hero}>
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow} data-reveal="">
                {christmasSeason ? "Noël avec Nalka" : "Les moments à partager"}
              </p>
              <h1 id="home-title" className={styles.heroTitle}>
                <span data-reveal="" data-delay="80">
                  {christmasSeason ? "Un Secret Santa." : "Les bons moments."}
                </span>
                <em data-reveal="" data-delay="160">
                  {christmasSeason
                    ? "Une belle excuse pour se retrouver."
                    : "Une belle raison de se retrouver."}
                </em>
              </h1>
              <p className={styles.heroDescription} data-reveal="" data-delay="240">
                {christmasSeason
                  ? "Invitez votre groupe, lancez un tirage privé et partagez quelques idées de cadeaux, si vous le souhaitez."
                  : "Un anniversaire, un dîner entre amis, une soirée avec les collègues. Retrouvez les idées et les préparatifs au même endroit."}
              </p>
              <div className={styles.heroActions} data-reveal="" data-delay="300">
                <Link className={styles.primaryButton} href={href}>
                  {label}
                </Link>
                <a className={styles.textLink} href="#fonctionnement">
                  Comment ça marche
                </a>
              </div>
              <p className={styles.reassurance} data-reveal="" data-delay="340">
                Pas besoin de compte pour commencer.
              </p>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroPhoto} data-reveal="photo" data-delay="120">
                <div className={styles.parallaxPhoto} data-home-parallax="">
                  <Image
                    src={christmasSeason ? images.christmas : images.dinner}
                    alt={
                      christmasSeason
                        ? "Un échange de cadeaux entre collègues à Noël"
                        : "Un moment à partager entre amis"
                    }
                    fill
                    priority
                    sizes="(min-width: 1024px) 42vw, 85vw"
                  />
                </div>
              </div>
              <div className={styles.heroDetail} data-reveal="photo" data-delay="260">
                <Image
                  src={images.detail}
                  alt="Des cadeaux pour les fêtes"
                  fill
                  sizes="(min-width: 1024px) 16vw, 1px"
                />
              </div>
              <CompactEventPreview />
            </div>
          </div>
        </section>

        <section className={styles.bridge} aria-labelledby="bridge-title">
          <div className={`${styles.container} ${styles.bridgeGrid}`}>
            <h2 id="bridge-title" className={styles.bridgeTitle} data-reveal="">
              Ça vous rappelle <em>quelque chose ?</em>
            </h2>
            <div className={styles.conversations}>
              <figure data-reveal="">
                <blockquote>
                  «{" "}
                  {christmasSeason
                    ? "Attends, tu as tiré qui, toi ?"
                    : "On avait dit quelle date, déjà ?"}{" "}
                  »
                </blockquote>
                <figcaption>
                  {christmasSeason
                    ? "Un tirage à organiser, des idées de cadeaux à retrouver."
                    : "Une date à choisir, des réponses à retrouver."}
                </figcaption>
              </figure>
              <figure data-reveal="" data-delay="100">
                <blockquote>
                  «{" "}
                  {christmasSeason
                    ? "Quelqu’un sait ce qui lui ferait plaisir ?"
                    : "Quelqu’un apporte le dessert ?"}{" "}
                  »
                </blockquote>
                <figcaption>Les suggestions se perdent dans la conversation de groupe.</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="fonctionnement" className={styles.how} aria-labelledby="steps-title">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow} data-reveal="">
                Comment ça marche
              </p>
              <h2 id="steps-title" className={styles.sectionTitle} data-reveal="">
                {christmasSeason
                  ? "Trois étapes, puis place à la surprise."
                  : "Un Secret Santa, trois étapes pour se retrouver."}
              </h2>
            </div>
            <div className={styles.story} data-home-story="">
              <ol className={styles.stepList}>
                {steps.map(({ title, text }, index) => (
                  <li
                    key={title}
                    className={styles.stepItem}
                    data-home-step=""
                    data-active={index === 0 ? "true" : "false"}
                  >
                    <span className={styles.stepNumber} aria-hidden="true">
                      0{index + 1}
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                    <figure className={styles.inlineStepPreview}>
                      <StepPreview step={index} />
                      <figcaption className={styles.exampleCaption}>Données d’exemple</figcaption>
                    </figure>
                  </li>
                ))}
              </ol>
              <div className={styles.storyStage} aria-hidden="true">
                <div className={styles.storyPanel}>
                  {steps.map(({ title }, index) => (
                    <div
                      key={title}
                      className={styles.storyVisual}
                      data-home-step-visual=""
                      data-active={index === 0 ? "true" : "false"}
                    >
                      <StepPreview step={index} />
                    </div>
                  ))}
                  <div className={styles.storyProgress}>
                    <span>
                      Étape <span data-home-step-count="">1</span> sur 3
                    </span>
                    <span className={styles.progressCaption}>Données d’exemple</span>
                    <span className={styles.progressDots}>
                      {steps.map(({ title }, index) => (
                        <span
                          key={title}
                          data-home-step-dot=""
                          data-active={index === 0 ? "true" : "false"}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="confidentialite" className={styles.privacy} aria-labelledby="privacy-title">
          <div className={`${styles.container} ${styles.privacyGrid}`}>
            <div>
              <p className={styles.eyebrow} data-reveal="">
                Les surprises
              </p>
              <h2 id="privacy-title" className={styles.sectionTitle} data-reveal="">
                Tout le monde voit l’essentiel. <em>Personne ne voit la surprise.</em>
              </h2>
              <ul className={styles.privacyList}>
                {privacy.map(({ title, text }) => (
                  <li key={title} data-reveal="">
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <EventPreview />
          </div>
        </section>

        <section id="occasions" className={styles.occasions} aria-labelledby="occasions-title">
          <div className={styles.container}>
            <div className={styles.occasionsHeading}>
              <div className={styles.sectionHeading}>
                <p className={styles.eyebrow} data-reveal="">
                  Toute l’année
                </p>
                <h2 id="occasions-title" className={styles.sectionTitle} data-reveal="">
                  {christmasSeason ? "Et après les fêtes ?" : "Toutes les occasions sont bonnes."}
                </h2>
              </div>
              <p data-reveal="">
                Noël n’est qu’une occasion parmi d’autres. Gardez Nalka sous le coude pour les
                prochaines retrouvailles.
              </p>
            </div>
            <div className={styles.occasionsGrid}>
              <article className={styles.birthdayOccasion} data-reveal="">
                <div className={styles.occasionPhoto}>
                  <div className={styles.parallaxPhoto} data-home-parallax="">
                    <Image
                      src={images.birthday}
                      alt="Un anniversaire à partager"
                      fill
                      sizes="(min-width: 860px) 43vw, 100vw"
                    />
                  </div>
                </div>
                <h3>Un anniversaire</h3>
                <p>
                  Invitez vos proches, partagez vos idées de cadeaux et préparez la fête ensemble.
                </p>
                <span>Invités · Listes d’envies</span>
              </article>
              <div className={styles.moreOccasions}>
                <article data-reveal="">
                  <div className={styles.occasionPhoto}>
                    <div className={styles.parallaxPhoto} data-home-parallax="">
                      <Image
                        src={images.dinner}
                        alt="Un dîner à la maison entre amis"
                        fill
                        sizes="(min-width: 860px) 47vw, 100vw"
                      />
                    </div>
                  </div>
                  <h3>Un dîner à la maison</h3>
                  <p>
                    Choisissez la date avec un sondage, puis répartissez l’entrée, le dessert et les
                    boissons.
                  </p>
                  <span>Sondages · Qui apporte quoi</span>
                </article>
                <article className={styles.colleaguesOccasion} data-reveal="">
                  <div className={styles.occasionPhoto}>
                    <Image
                      src={images.christmas}
                      alt="Des collègues réunis pour un échange de cadeaux"
                      fill
                      sizes="(min-width: 860px) 18vw, 100vw"
                    />
                  </div>
                  <div>
                    <h3>Un moment entre collègues</h3>
                    <p>
                      Un pot de départ, une sortie d’équipe : notez qui a payé quoi et faites les
                      comptes simplement.
                    </p>
                    <span>Invités · Dépenses partagées</span>
                  </div>
                </article>
                <Link className={styles.textLink} href="/event/new">
                  Créer un autre type d’événement
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.finalSection} aria-labelledby="final-title">
          <div className={styles.finalGrid}>
            <div className={styles.finalPhoto} data-reveal="photo">
              <div className={styles.parallaxPhoto} data-home-parallax="">
                <Image
                  src={images.dinner}
                  alt="Le plaisir de se retrouver autour d’une table"
                  fill
                  sizes="(min-width: 860px) 60vw, 100vw"
                />
              </div>
            </div>
            <div className={styles.finalCopy}>
              <h2 id="final-title" data-reveal="">
                {christmasSeason ? (
                  <>
                    Cette année, c’est vous qui lancez <em>le tirage.</em>
                  </>
                ) : (
                  <>
                    Et le prochain moment, <em>c’est avec qui ?</em>
                  </>
                )}
              </h2>
              <p data-reveal="">
                {christmasSeason
                  ? "Créez votre Secret Santa et invitez votre groupe. Le reste se racontera autour de la table."
                  : "Créez votre événement et invitez votre groupe. Les bons moments commencent par une invitation."}
              </p>
              <div data-reveal="">
                <Link className={styles.lightButton} href={href}>
                  {label}
                </Link>
                <p className={styles.reassurance}>Pas besoin de compte pour commencer.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HomepageMotion>
  );
}
