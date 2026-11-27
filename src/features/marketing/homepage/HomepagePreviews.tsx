import { Copy, Gift, LockKeyhole } from "lucide-react";

import styles from "./homepage.module.css";

const participants = ["Léa", "Camille", "Hugo", "Inès", "Malik", "Sophie"] as const;
const exampleDate = "Samedi 19 décembre 2026, à 19 h 30";

function Avatars() {
  return (
    <span className={styles.avatars} aria-hidden="true">
      {participants.map((name, index) => (
        <span key={name} className={styles.avatar} data-tone={index % 4}>
          {name[0]}
        </span>
      ))}
    </span>
  );
}

function PrivateLabel() {
  return (
    <span className={styles.privateLabel}>
      <LockKeyhole size={13} aria-hidden="true" /> Sur invitation
    </span>
  );
}

export function CompactEventPreview() {
  return (
    <figure className={styles.compactPreview} data-reveal="" data-delay="360">
      <div className={styles.previewTopline}>
        <span className={styles.previewEyebrow}>Secret Santa</span>
        <PrivateLabel />
      </div>
      <div className={styles.previewHeading}>
        <span className={styles.previewTitle}>Noël entre amis</span>
        <span className={styles.previewMetadata}>{exampleDate}</span>
      </div>
      <div className={styles.previewPeople}>
        <Avatars />
        <span>6 participants</span>
      </div>
      <div className={styles.drawStatus}>
        <span className={styles.statusDot} aria-hidden="true" />
        <div>
          <strong>Tirage effectué</strong>
          <span>Chaque personne découvre son résultat en privé.</span>
        </div>
      </div>
      <figcaption className={styles.exampleCaption}>Données d’exemple</figcaption>
    </figure>
  );
}

export function StepPreview({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className={styles.stepPreview}>
        <div className={styles.previewTopline}>
          <span className={styles.previewEyebrow}>Secret Santa</span>
          <span className={styles.christmasTag}>Noël</span>
        </div>
        <div className={styles.previewHeading}>
          <span className={styles.previewTitle}>Noël entre amis</span>
          <span className={styles.previewMetadata}>{exampleDate}</span>
        </div>
        <span className={styles.previewEyebrow}>Participants · 6</span>
        <ul className={styles.participantList}>
          {participants.map((name, index) => (
            <li key={name}>
              <span className={styles.avatar} data-tone={index % 4} aria-hidden="true">
                {name[0]}
              </span>
              <span>{name}</span>
              <span className={styles.participantStatus}>
                {index === 0 ? "Organisatrice" : index === 5 ? "Invitation envoyée" : "A rejoint"}
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.invitationPreview}>
          <span>Lien d’invitation</span>
          <span>
            <Copy size={13} aria-hidden="true" /> Copier le lien
          </span>
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className={styles.stepPreview}>
        <div className={styles.previewTopline}>
          <span className={styles.previewEyebrow}>Tirage au sort</span>
          <span className={styles.completedLabel}>Tirage effectué</span>
        </div>
        <div className={styles.assignmentPreview}>
          <Gift size={30} strokeWidth={1.3} aria-hidden="true" />
          <span>Votre attribution vous attend.</span>
          <strong>À qui ferez-vous plaisir ?</strong>
          <span className={styles.previewAction}>Découvrir à qui j’offre</span>
          <span className={styles.privateLabel}>
            <LockKeyhole size={13} aria-hidden="true" /> Visible uniquement par vous
          </span>
        </div>
        <p className={styles.previewNote}>
          Chacun découvre sa propre attribution. Celles des autres restent secrètes, y compris pour
          la personne qui organise.
        </p>
      </div>
    );
  }
  return (
    <div className={styles.stepPreview}>
      <span className={styles.previewEyebrow}>Liste d’envies · facultative</span>
      <span className={styles.previewTitle}>Les envies de Camille</span>
      <ul className={styles.wishlistPreview}>
        <li>
          <span>Un livre de recettes italiennes</span>
          <span>Réservé par vous</span>
        </li>
        <li>
          <span>Des gants en laine, plutôt gris</span>
          <span>Déjà réservé</span>
        </li>
        <li>
          <span>Une bougie au figuier</span>
          <span>Disponible</span>
        </li>
      </ul>
      <p className={styles.previewNote}>
        <LockKeyhole size={15} aria-hidden="true" />
        Camille ne voit pas les réservations de sa liste. L’identité des autres personnes qui
        réservent reste cachée.
      </p>
    </div>
  );
}

export function EventPreview() {
  return (
    <figure className={styles.eventPreview} data-reveal="">
      <div className={styles.eventPreviewBar}>
        <span className={styles.wordmark}>Nalka</span>
        <span>/</span>
        <span>Noël entre amis</span>
        <PrivateLabel />
      </div>
      <div className={styles.eventPreviewBody}>
        <div className={styles.previewHeading}>
          <span className={styles.previewEyebrow}>Secret Santa · Listes d’envies</span>
          <span className={styles.eventPreviewTitle}>Noël entre amis</span>
          <span className={styles.previewMetadata}>{exampleDate}</span>
        </div>
        <div className={styles.eventPreviewColumns}>
          <div className={styles.eventPreviewTile}>
            <span className={styles.previewEyebrow}>Participants · 6</span>
            <Avatars />
            <p>Léa, Camille, Hugo, Inès, Malik et Sophie</p>
          </div>
          <div className={`${styles.eventPreviewTile} ${styles.assignmentTile}`}>
            <span className={styles.previewEyebrow}>Secret Santa</span>
            <span className={styles.previewTitle}>Votre attribution vous attend.</span>
            <span className={styles.previewAction}>Découvrir à qui j’offre</span>
          </div>
        </div>
        <div className={styles.wishlistTile}>
          <div>
            <span className={styles.previewEyebrow}>Ma liste d’envies · facultative</span>
            <p>3 idées partagées avec le groupe</p>
          </div>
          <span className={styles.previewNote}>
            <LockKeyhole size={16} aria-hidden="true" />
            Les réservations sur votre liste vous restent cachées.
          </span>
        </div>
      </div>
      <figcaption className={styles.exampleCaption}>Données d’exemple</figcaption>
    </figure>
  );
}
