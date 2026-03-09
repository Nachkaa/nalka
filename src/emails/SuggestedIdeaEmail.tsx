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

export type SuggestedIdeaEmailProps = {
  eventTitle: string;
  itemTitle: string;
  eventUrl: string;
  appName?: string;
};

export default function SuggestedIdeaEmail({
  eventTitle,
  itemTitle,
  eventUrl,
  appName = "Nalka",
}: SuggestedIdeaEmailProps) {
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

  const preheader = `Une nouvelle idée a été proposée pour ta liste ${eventTitle}`;

  return (
    <Html>
      <Head />
      <Preview>{preheader}</Preview>

      <Body
        style={{
          backgroundColor: brand.bg,
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
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
            {/* Header */}
            <Text
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: brand.text,
              }}
            >
              💡 Une nouvelle idée pour ta liste
            </Text>

            <Text
              style={{
                marginTop: 8,
                fontSize: 16,
                lineHeight: 1.5,
                color: brand.text,
              }}
            >
              Quelqu’un vient de suggérer une nouvelle idée dans ta liste pour l’événement{" "}
              <strong>{eventTitle}</strong>.
            </Text>

            {/* Suggestion card */}
            <Section
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#FAFAF9",
                border: `1px solid ${brand.border}`,
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: brand.text,
                }}
              >
                Suggestion :
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: brand.text,
                }}
              >
                {itemTitle}
              </Text>
            </Section>

            {/* Context / reassurance */}
            <Text
              style={{
                marginTop: 16,
                fontSize: 14,
                lineHeight: 1.6,
                color: brand.muted,
              }}
            >
              Tu retrouveras cette idée dans la section{" "}
              <strong>« Propositions de ton entourage »</strong> de ta liste. Tu peux la modifier,
              la garder telle quelle ou la retirer à tout moment.
            </Text>

            <Text
              style={{
                marginTop: 8,
                fontSize: 13,
                lineHeight: 1.6,
                color: brand.muted,
              }}
            >
              La suggestion reste anonyme : seules l’idée et les détails du cadeau sont partagés
              avec toi.
            </Text>

            {/* CTA */}
            <Section
              style={{
                textAlign: "center",
                marginTop: 20,
              }}
            >
              <Button
                href={eventUrl}
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
                Voir ma liste
              </Button>
            </Section>

            {/* Fallback link */}
            <Text
              style={{
                marginTop: 18,
                fontSize: 13,
                lineHeight: 1.5,
                color: brand.muted,
              }}
            >
              Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :
              <br />
              <span
                style={{
                  wordBreak: "break-all",
                  color: brand.text,
                  fontSize: 13,
                }}
              >
                {eventUrl}
              </span>
            </Text>

            <Hr
              style={{
                borderColor: brand.border,
                margin: "20px 0 12px",
              }}
            />

            {/* Footer */}
            <Text
              style={{
                marginTop: 0,
                fontSize: 12,
                lineHeight: 1.6,
                color: brand.muted,
              }}
            >
              {appName} t’aide à préparer sereinement tes moments avec tes proches. Tu recevras ce
              type d’email à chaque fois qu’une nouvelle idée est proposée pour ta liste.
            </Text>
          </Section>

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
