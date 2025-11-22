import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

export type MagicLinkEmailProps = {
  url: string;
  appName?: string;
  supportEmail?: string;
  expiresAt?: Date;
};

export default function MagicLinkEmail({
  url,
  appName = "Nalka",
  supportEmail = "support@giftlist.local",
  expiresAt,
}: MagicLinkEmailProps) {
  const brand = {
    bg: "#FAF8F1", // cream
    card: "#FFFFFF",
    text: "#0B3D2E", // deep green
    muted: "#475569",
    border: "#E7E2D6",
    accent: "#EAB308", // gold
    btnBg: "#0B3D2E",
    btnText: "#FFFBE6",
  };

  const preheader = `Connexion en un clic à ${appName}`;

  const formattedExpiry =
    expiresAt &&
    expiresAt.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <Html>
      <Head />
      <Preview>{preheader}</Preview>

      <Body
        style={{
          backgroundColor: brand.bg,
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          margin: 0,
          padding: "16px 0",
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            width: "100%",
            margin: "0 auto",
            padding: "0 16px",
          }}
        >
          <Section
            style={{
              backgroundColor: brand.card,
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: `1px solid ${brand.border}`,
            }}
          >
            {/* Header / branding */}
            <Text
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: brand.text,
              }}
            >
              ✨ Bienvenue chez {appName}
            </Text>

            <Text
              style={{
                marginTop: 8,
                fontSize: 16,
                lineHeight: 1.5,
                color: brand.text,
              }}
            >
              Accédez à votre espace et continuez à préparer vos moments
              importants avec les personnes qui comptent.
            </Text>

            {/* Call-to-action button */}
            <Section
              style={{
                textAlign: "center",
                marginTop: 20,
              }}
            >
              <Button
                href={url}
                style={{
                  display: "inline-block",
                  width: "100%",
                  maxWidth: 260,
                  padding: "12px 18px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 15,
                  backgroundColor: brand.btnBg,
                  color: brand.btnText,
                  border: `1px solid ${brand.accent}`,
                }}
              >
                Ouvrir mon espace
              </Button>
            </Section>

            {/* Fallback link */}
            <Text
              style={{
                marginTop: 18,
                fontSize: 14,
                lineHeight: 1.5,
                color: brand.muted,
              }}
            >
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre
              navigateur :
              <br />
              <span
                style={{
                  wordBreak: "break-all",
                  color: brand.text,
                  fontSize: 13,
                }}
              >
                {url}
              </span>
            </Text>

            {/* Expiration info */}
            {formattedExpiry ? (
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: brand.muted,
                }}
              >
                Ce lien est valable jusqu’au {formattedExpiry}. Pour votre
                sécurité, il expirera automatiquement ensuite.
              </Text>
            ) : null}

            <Hr
              style={{
                borderColor: brand.border,
                margin: "20px 0 12px",
              }}
            />

            {/* Security / support */}
            <Text
              style={{
                marginTop: 0,
                fontSize: 12,
                lineHeight: 1.6,
                color: brand.muted,
              }}
            >
              Si vous n’êtes pas à l’origine de cette demande, ne tenez pas
              compte de ce message : personne ne pourra se connecter sans
              cliquer sur le lien.
              <br />
              Besoin d’aide ? Écrivez-nous à{" "}
              <a
                href={`mailto:${supportEmail}`}
                style={{ color: brand.text, textDecoration: "none" }}
              >
                {supportEmail}
              </a>
              .
            </Text>
          </Section>

          {/* Footer */}
          <Text
            style={{
              marginTop: 12,
              fontSize: 12,
              color: brand.muted,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            © {new Date().getFullYear()} {appName} — Prenez soin de vos moments.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
