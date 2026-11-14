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
import { EMAIL_BRAND as TOKENS, EMAIL_FONT_FAMILY, EmailBrandHeader } from "./brand";

export default function SecretSantaAssignedEmail({
  giverName,
  receiverName,
  eventTitle,
  eventUrl,
}: {
  giverName: string;
  receiverName: string;
  eventTitle: string;
  eventUrl: string;
}) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Ton partenaire Secret Santa a été tiré 🎁</Preview>
      <Body
        style={{
          margin: 0,
          padding: "32px 0",
          backgroundColor: TOKENS.bg,
          fontFamily: EMAIL_FONT_FAMILY,
          color: TOKENS.text,
        }}
      >
        <Container
          style={{
            maxWidth: 600,
            width: "100%",
            margin: "0 auto",
            padding: "0 16px",
            boxSizing: "border-box",
          }}
        >
          <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
            <tbody>
              <tr>
                <td align="center" style={{ paddingBottom: 18 }}>
                  <EmailBrandHeader appName="Nalka" />
                </td>
              </tr>
            </tbody>
          </table>
          <Section
            style={{
              backgroundColor: TOKENS.card,
              borderRadius: 20,
              padding: 32,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: TOKENS.text,
              }}
            >
              🎄 Secret Santa
            </Text>

            <Text style={{ marginTop: 12, fontSize: 16, color: TOKENS.text }}>
              Bonjour {giverName},
              <br />
              <br />
              Le tirage au sort pour <b>{eventTitle}</b> est terminé !
              <br />
              Tu devras offrir un cadeau à :
            </Text>

            <Section
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 12,
                backgroundColor: TOKENS.primary100,
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontSize: 20,
                  lineHeight: "28px",
                  fontWeight: 700,
                  color: TOKENS.primary700,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {receiverName}
              </Text>
            </Section>

            <Section style={{ textAlign: "center", marginTop: 24 }}>
              <Button
                href={eventUrl}
                style={{
                  display: "inline-block",
                  padding: "14px 18px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontSize: 16,
                  lineHeight: "20px",
                  fontWeight: 700,
                  backgroundColor: TOKENS.primary600,
                  color: TOKENS.onPrimary,
                  border: `1px solid ${TOKENS.primary600}`,
                }}
              >
                Voir l’événement
              </Button>
            </Section>

            <Hr style={{ borderColor: TOKENS.border, margin: "24px 0" }} />

            <Text style={{ marginTop: 0, fontSize: 12, color: TOKENS.muted }}>
              Garde ton attribution secrète jusqu’à l’échange des cadeaux.
            </Text>
          </Section>

          <Text
            style={{
              marginTop: 12,
              fontSize: 12,
              color: TOKENS.muted,
              textAlign: "center",
            }}
          >
            © {new Date().getFullYear()} Nalka
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
