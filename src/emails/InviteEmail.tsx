import { Html, Head, Preview, Body, Container, Section, Text, Button, Hr } from "@react-email/components";

export function InviteEmail({
  link,
  eventTitle,
  inviterName,
  appName = "Nalka",
}: {
  link: string;
  eventTitle: string;
  inviterName: string;
  appName?: string;
}) {
  const brand = {
    bg: "#FAF8F1",
    card: "#FFFFFF",
    text: "#0B3D2E",
    muted: "#475569",
    border: "#E7E2D6",
    accent: "#EAB308",
    btnBg: "#0B3D2E",
    btnText: "#FFFBE6",
  };

  return (
    <Html>
      <Head />
      <Preview>Vous avez été ajouté à « {eventTitle} »</Preview>
      <Body style={{ backgroundColor: brand.bg, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <Section style={{ backgroundColor: brand.card, borderRadius: 16, padding: 24, border: `1px solid ${brand.border}` }}>
            <Text style={{ margin: 0, fontSize: 18, fontWeight: 700, color: brand.text }}>✨ {appName}</Text>
            <Text style={{ marginTop: 8, fontSize: 16, color: brand.text }}>
              {inviterName} t’a ajouté à l’événement « {eventTitle} ». Clique sur le lien pour préparer votre moment ensemble.
            </Text>
            <Section style={{ textAlign: "center", marginTop: 16 }}>
              <Button
                href={link}
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
                Rejoindre l’événement
              </Button>
            </Section>
            <Text style={{ marginTop: 16, fontSize: 14, color: brand.muted }}>
              Si le bouton ne fonctionne pas, copiez-collez ce lien :
              <br />
              <span style={{ wordBreak: "break-all", color: brand.text }}>{link}</span>
            </Text>
            <Hr style={{ borderColor: brand.border, margin: "16px 0" }} />
            <Text style={{ marginTop: 0, fontSize: 12, color: brand.muted }}>
              Vous n’êtes pas à l’origine de cette action ? Ignorez ce message.
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
