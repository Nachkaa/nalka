import { Html, Head, Preview, Body, Container, Section, Text, Button, Hr } from "@react-email/components";

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
    bg: "#FAF8F1",         // cream
    card: "#FFFFFF",
    text: "#0B3D2E",       // deep green
    muted: "#475569",
    border: "#E7E2D6",
    accent: "#EAB308",     // gold
    btnBg: "#0B3D2E",
    btnText: "#FFFBE6",
  };

  const preheader = `Connexion en un clic à ${appName}`;
  return (
    <Html>
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={{ backgroundColor: brand.bg, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <Section
            style={{
              backgroundColor: brand.card,
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: `1px solid ${brand.border}`,
            }}
          >
            <Text style={{ margin: 0, fontSize: 18, fontWeight: 700, color: brand.text }}>✨ {appName}</Text>
            <Text style={{ marginTop: 8, fontSize: 16, color: brand.text }}>
              Connectez-vous pour préparer votre moment avec vos proches.
            </Text>

            <Section style={{ textAlign: "center", marginTop: 16 }}>
              <Button
                href={url}
                style={{
                  display: "inline-block",
                  padding: "12px 18px",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontWeight: 600,
                  backgroundColor: brand.btnBg,
                  color: brand.btnText,
                  border: `1px solid ${brand.accent}`,
                }}
              >
                Ouvrir {appName}
              </Button>
            </Section>

            <Text style={{ marginTop: 16, fontSize: 14, color: brand.muted }}>
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
              <br />
              <span style={{ wordBreak: "break-all", color: brand.text }}>{url}</span>
            </Text>

            {expiresAt ? (
              <Text style={{ marginTop: 8, fontSize: 12, color: brand.muted }}>
                Ce lien expire le {expiresAt.toLocaleString()}.
              </Text>
            ) : null}

            <Hr style={{ borderColor: brand.border, margin: "16px 0" }} />

            <Text style={{ marginTop: 0, fontSize: 12, color: brand.muted }}>
              Vous n’êtes pas à l’origine de cette demande ? Ignorez ce message.
              <br />
              Besoin d’aide ? <a href={`mailto:${supportEmail}`} style={{ color: brand.text }}>{supportEmail}</a>
            </Text>
          </Section>

          <Text style={{ marginTop: 12, fontSize: 12, color: brand.muted, textAlign: "center" }}>
            © {new Date().getFullYear()} {appName}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
